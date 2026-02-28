import bcrypt from "bcrypt";
import jwt, { type JwtPayload, type SignOptions, type Secret } from "jsonwebtoken";
import { randomUUID } from "node:crypto";

import prisma from "@/utils/prisma";
import { AppError } from "@/utils/errors";
import { hashToken } from "@/modules/auth/services/token-hash.service";

import type {
  LoginResult,
  LogoutResult,
  RegisterResult,
  TokenRefreshResult,
} from "@/modules/auth/types/auth.types";
import type {
  LoginInput,
  LogoutInput,
  RegisterInput,
  TokenRefreshInput,
} from "@/modules/auth/schemas/auth.schema";

interface UserTokenClaims {
  sub: string;
  email: string;
  type: "access";
}

interface RefreshTokenClaims {
  sub: string;
  jti: string;
  type: "refresh";
}

const DEFAULT_ACCESS_TOKEN_TTL = "15m";
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 30;
const DEFAULT_BCRYPT_ROUNDS = 12;

function getJwtSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): Secret {
  const value =
    process.env[name] ??
    (name === "JWT_ACCESS_SECRET" ? process.env.JWT_SECRET : undefined);

  if (!value) {
    throw new AppError(
      500,
      "CONFIGURATION_ERROR",
      `Missing required environment variable: ${name}.`,
    );
  }

  return value;
}

function getAccessTokenExpiry(): SignOptions["expiresIn"] {
  return (process.env.ACCESS_TOKEN_TTL ??
    DEFAULT_ACCESS_TOKEN_TTL) as SignOptions["expiresIn"];
}

function getRefreshTokenTtlDays(): number {
  const value = Number(
    process.env.REFRESH_TOKEN_TTL_DAYS ?? DEFAULT_REFRESH_TOKEN_TTL_DAYS,
  );

  if (!Number.isFinite(value) || value < 1) {
    throw new AppError(
      500,
      "CONFIGURATION_ERROR",
      "REFRESH_TOKEN_TTL_DAYS must be a positive number.",
    );
  }

  return Math.floor(value);
}

function getBcryptRounds(): number {
  const value = Number(process.env.BCRYPT_SALT_ROUNDS ?? DEFAULT_BCRYPT_ROUNDS);

  if (!Number.isFinite(value) || value < 8) {
    throw new AppError(
      500,
      "CONFIGURATION_ERROR",
      "BCRYPT_SALT_ROUNDS must be a number >= 8.",
    );
  }

  return Math.floor(value);
}

function assertRefreshClaims(payload: string | JwtPayload): RefreshTokenClaims {
  if (
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string" ||
    payload.type !== "refresh"
  ) {
    throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token.");
  }

  return {
    sub: payload.sub,
    jti: payload.jti,
    type: "refresh",
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function issueTokenPair(user: { id: string; email: string }): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const accessTokenSecret = getJwtSecret("JWT_ACCESS_SECRET");
  const refreshTokenSecret = getJwtSecret("JWT_REFRESH_SECRET");
  const refreshTokenTtlDays = getRefreshTokenTtlDays();
  const refreshTokenJti = randomUUID();

  const accessClaims: UserTokenClaims = {
    sub: user.id,
    email: user.email,
    type: "access",
  };

  const refreshClaims: RefreshTokenClaims = {
    sub: user.id,
    jti: refreshTokenJti,
    type: "refresh",
  };

  const accessToken = jwt.sign(accessClaims, accessTokenSecret, {
    expiresIn: getAccessTokenExpiry(),
  });

  const refreshToken = jwt.sign(refreshClaims, refreshTokenSecret, {
    expiresIn: `${refreshTokenTtlDays}d`,
  });

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: addDays(new Date(), refreshTokenTtlDays),
    },
  });

  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered.");
  }

  const passwordHash = await bcrypt.hash(input.password, getBcryptRounds());

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
    },
  });

  const tokens = await issueTokenPair(user);

  return {
    userId: user.id,
    email: user.email,
    tokens,
  };
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const tokens = await issueTokenPair(user);

  return {
    userId: user.id,
    email: user.email,
    tokens,
  };
}

export async function refreshAuthToken(
  input: TokenRefreshInput,
): Promise<TokenRefreshResult> {
  const refreshTokenSecret = getJwtSecret("JWT_REFRESH_SECRET");

  let claims: RefreshTokenClaims;

  try {
    const decoded = jwt.verify(input.refreshToken, refreshTokenSecret);
    claims = assertRefreshClaims(decoded);
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token.");
  }

  const tokenHash = hashToken(input.refreshToken);
  const revokedToken = await prisma.revokedToken.findUnique({
    where: { tokenHash },
    select: { id: true },
  });

  if (revokedToken) {
    throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token.");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });

  if (!storedToken || storedToken.userId !== claims.sub) {
    throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token.");
  }

  if (storedToken.expiresAt <= new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError(401, "TOKEN_EXPIRED", "Refresh token has expired.");
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token.");
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  const tokens = await issueTokenPair(user);

  return { tokens };
}

export async function logoutUser(
  input: LogoutInput,
  accessToken: string,
  userId: string,
): Promise<LogoutResult> {
  const refreshTokenSecret = getJwtSecret("JWT_REFRESH_SECRET");

  let claims: RefreshTokenClaims;

  try {
    const decoded = jwt.verify(input.refreshToken, refreshTokenSecret);
    claims = assertRefreshClaims(decoded);
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token.");
  }

  if (claims.sub !== userId) {
    throw new AppError(403, "FORBIDDEN", "Refresh token does not belong to the user.");
  }

  const refreshTokenHash = hashToken(input.refreshToken);
  const accessTokenHash = hashToken(accessToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: refreshTokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });

  if (!storedToken || storedToken.userId !== userId) {
    throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token.");
  }

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: storedToken.id } }),
    prisma.revokedToken.upsert({
      where: { tokenHash: refreshTokenHash },
      update: {
        tokenType: "REFRESH",
        userId,
        expiresAt: storedToken.expiresAt,
      },
      create: {
        tokenHash: refreshTokenHash,
        tokenType: "REFRESH",
        userId,
        expiresAt: storedToken.expiresAt,
      },
    }),
    prisma.revokedToken.upsert({
      where: { tokenHash: accessTokenHash },
      update: {
        tokenType: "ACCESS",
        userId,
      },
      create: {
        tokenHash: accessTokenHash,
        tokenType: "ACCESS",
        userId,
      },
    }),
  ]);

  return { success: true };
}
