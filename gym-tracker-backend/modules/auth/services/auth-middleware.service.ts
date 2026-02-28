import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";

import prisma from "@/utils/prisma";
import { AppError } from "@/utils/errors";
import { hashToken } from "@/modules/auth/services/token-hash.service";

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

function getAccessTokenSecret(): Secret {
  const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError(
      500,
      "CONFIGURATION_ERROR",
      "Missing required environment variable: JWT_ACCESS_SECRET.",
    );
  }

  return secret;
}

export function getBearerTokenFromRequest(request: Request): string {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader) {
    throw new AppError(401, "UNAUTHORIZED", "Missing authorization header.");
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid authorization header.");
  }

  return token;
}

function parseAccessTokenPayload(payload: string | JwtPayload): AuthenticatedUser {
  if (
    typeof payload !== "object" ||
    payload.type !== "access" ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string"
  ) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid access token.");
  }

  return {
    userId: payload.sub,
    email: payload.email,
  };
}

export async function requireAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser> {
  const token = getBearerTokenFromRequest(request);

  let payload: AuthenticatedUser;

  try {
    const decoded = jwt.verify(token, getAccessTokenSecret());
    payload = parseAccessTokenPayload(decoded);
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired access token.");
  }

  const revokedToken = await prisma.revokedToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true },
  });

  if (revokedToken) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired access token.");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired access token.");
  }

  return {
    userId: user.id,
    email: user.email,
  };
}
