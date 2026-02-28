import { beforeEach, describe, expect, it, vi } from "vitest";

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
};

type RefreshTokenRecord = {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
};

type RateLimitRecord = {
  id: string;
  identifier: string;
  endpoint: string;
  createdAt: Date;
};

type RevokedTokenRecord = {
  id: string;
  tokenHash: string;
  tokenType: string;
  userId: string;
  expiresAt: Date | null;
  createdAt: Date;
};

const testDb = vi.hoisted(() => {
  const state: {
    users: UserRecord[];
    refreshTokens: RefreshTokenRecord[];
    rateLimits: RateLimitRecord[];
    revokedTokens: RevokedTokenRecord[];
  } = {
    users: [],
    refreshTokens: [],
    rateLimits: [],
    revokedTokens: [],
  };

  let sequence = 0;

  const nextId = (prefix: string): string => {
    sequence += 1;
    return `${prefix}-${sequence}`;
  };

  const prismaMock = {
    user: {
      findUnique: vi.fn(
        async (args: { where: { email?: string; id?: string }; select?: Record<string, boolean> }) => {
          const user = args.where.email
            ? state.users.find((item) => item.email === args.where.email)
            : state.users.find((item) => item.id === args.where.id);

          if (!user) {
            return null;
          }

          if (!args.select) {
            return user;
          }

          return Object.fromEntries(
            Object.entries(args.select)
              .filter(([, selected]) => selected)
              .map(([key]) => [key, (user as Record<string, unknown>)[key]]),
          );
        },
      ),
      create: vi.fn(
        async (args: { data: { email: string; passwordHash: string }; select?: Record<string, boolean> }) => {
          const created: UserRecord = {
            id: nextId("user"),
            email: args.data.email,
            passwordHash: args.data.passwordHash,
          };

          state.users.push(created);

          if (!args.select) {
            return created;
          }

          return Object.fromEntries(
            Object.entries(args.select)
              .filter(([, selected]) => selected)
              .map(([key]) => [key, (created as Record<string, unknown>)[key]]),
          );
        },
      ),
    },
    refreshToken: {
      create: vi.fn(async (args: { data: { tokenHash: string; userId: string; expiresAt: Date } }) => {
        const created: RefreshTokenRecord = {
          id: nextId("refresh"),
          tokenHash: args.data.tokenHash,
          userId: args.data.userId,
          expiresAt: args.data.expiresAt,
        };

        state.refreshTokens.push(created);
        return created;
      }),
      findUnique: vi.fn(
        async (args: { where: { tokenHash: string }; select?: Record<string, boolean> }) => {
          const token = state.refreshTokens.find((item) => item.tokenHash === args.where.tokenHash);

          if (!token) {
            return null;
          }

          if (!args.select) {
            return token;
          }

          return Object.fromEntries(
            Object.entries(args.select)
              .filter(([, selected]) => selected)
              .map(([key]) => [key, (token as Record<string, unknown>)[key]]),
          );
        },
      ),
      delete: vi.fn(async (args: { where: { id: string } }) => {
        const index = state.refreshTokens.findIndex((item) => item.id === args.where.id);
        if (index < 0) {
          throw new Error("Record not found");
        }

        const [deleted] = state.refreshTokens.splice(index, 1);
        return deleted;
      }),
    },
    rateLimit: {
      count: vi.fn(async (args: { where: { identifier: string; endpoint: string; createdAt: { gte: Date } } }) => {
        return state.rateLimits.filter(
          (item) =>
            item.identifier === args.where.identifier &&
            item.endpoint === args.where.endpoint &&
            item.createdAt >= args.where.createdAt.gte,
        ).length;
      }),
      create: vi.fn(async (args: { data: { identifier: string; endpoint: string } }) => {
        const created: RateLimitRecord = {
          id: nextId("rl"),
          identifier: args.data.identifier,
          endpoint: args.data.endpoint,
          createdAt: new Date(),
        };

        state.rateLimits.push(created);
        return created;
      }),
    },
    revokedToken: {
      findUnique: vi.fn(
        async (args: { where: { tokenHash: string }; select?: Record<string, boolean> }) => {
          const token = state.revokedTokens.find((item) => item.tokenHash === args.where.tokenHash);

          if (!token) {
            return null;
          }

          if (!args.select) {
            return token;
          }

          return Object.fromEntries(
            Object.entries(args.select)
              .filter(([, selected]) => selected)
              .map(([key]) => [key, (token as Record<string, unknown>)[key]]),
          );
        },
      ),
      upsert: vi.fn(
        async (args: {
          where: { tokenHash: string };
          create: { tokenHash: string; tokenType: string; userId: string; expiresAt?: Date };
          update: { tokenType: string; userId: string; expiresAt?: Date };
        }) => {
          const existing = state.revokedTokens.find((item) => item.tokenHash === args.where.tokenHash);

          if (existing) {
            existing.tokenType = args.update.tokenType;
            existing.userId = args.update.userId;
            existing.expiresAt = args.update.expiresAt ?? null;
            return existing;
          }

          const created: RevokedTokenRecord = {
            id: nextId("revoked"),
            tokenHash: args.create.tokenHash,
            tokenType: args.create.tokenType,
            userId: args.create.userId,
            expiresAt: args.create.expiresAt ?? null,
            createdAt: new Date(),
          };

          state.revokedTokens.push(created);
          return created;
        },
      ),
    },
    $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => {
      return Promise.all(operations);
    }),
  };

  const reset = (): void => {
    state.users.length = 0;
    state.refreshTokens.length = 0;
    state.rateLimits.length = 0;
    state.revokedTokens.length = 0;
    sequence = 0;
  };

  return { prismaMock, reset };
});

vi.mock("@/utils/prisma", () => ({
  default: testDb.prismaMock,
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as refreshPost } from "@/app/api/auth/refresh/route";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { GET as meGet } from "@/app/api/users/me/route";

function createPostRequest(path: string, body: unknown, ip = "127.0.0.1"): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function createGetRequest(path: string, token?: string, ip = "127.0.0.1"): Request {
  const headers = new Headers({ "x-forwarded-for": ip });
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return new Request(`http://localhost${path}`, {
    method: "GET",
    headers,
  });
}

function createAuthenticatedPostRequest(
  path: string,
  body: unknown,
  accessToken: string,
  ip = "127.0.0.1",
): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("auth integration", () => {
  beforeEach(() => {
    testDb.reset();
    vi.clearAllMocks();

    process.env.JWT_ACCESS_SECRET = "access-secret-test";
    process.env.JWT_REFRESH_SECRET = "refresh-secret-test";
    process.env.ACCESS_TOKEN_TTL = "15m";
    process.env.REFRESH_TOKEN_TTL_DAYS = "7";
    process.env.BCRYPT_SALT_ROUNDS = "8";
  });

  it("registers and logs in a user", async () => {
    const registerResponse = await registerPost(
      createPostRequest("/api/auth/register", {
        email: "newuser@example.com",
        password: "StrongPass123",
      }),
    );

    expect(registerResponse.status).toBe(201);
    const registerPayload = (await registerResponse.json()) as {
      email: string;
      tokens: { accessToken: string; refreshToken: string };
    };

    expect(registerPayload.email).toBe("newuser@example.com");
    expect(registerPayload.tokens.accessToken.length).toBeGreaterThan(10);
    expect(registerPayload.tokens.refreshToken.length).toBeGreaterThan(10);

    const loginResponse = await loginPost(
      createPostRequest("/api/auth/login", {
        email: "newuser@example.com",
        password: "StrongPass123",
      }),
    );

    expect(loginResponse.status).toBe(200);
    const loginPayload = (await loginResponse.json()) as {
      email: string;
      tokens: { accessToken: string; refreshToken: string };
    };

    expect(loginPayload.email).toBe("newuser@example.com");
    expect(loginPayload.tokens.accessToken.length).toBeGreaterThan(10);
    expect(loginPayload.tokens.refreshToken.length).toBeGreaterThan(10);
  });

  it("rotates refresh tokens and rejects reused token", async () => {
    const registerResponse = await registerPost(
      createPostRequest("/api/auth/register", {
        email: "rotate@example.com",
        password: "StrongPass123",
      }),
    );

    const registerPayload = (await registerResponse.json()) as {
      tokens: { refreshToken: string };
    };
    const firstRefreshToken = registerPayload.tokens.refreshToken;

    const firstRefreshResponse = await refreshPost(
      createPostRequest("/api/auth/refresh", {
        refreshToken: firstRefreshToken,
      }),
    );

    expect(firstRefreshResponse.status).toBe(200);
    const firstRefreshPayload = (await firstRefreshResponse.json()) as {
      tokens: { refreshToken: string };
    };
    const secondRefreshToken = firstRefreshPayload.tokens.refreshToken;

    expect(secondRefreshToken).not.toBe(firstRefreshToken);

    const reusedTokenResponse = await refreshPost(
      createPostRequest("/api/auth/refresh", {
        refreshToken: firstRefreshToken,
      }),
    );

    expect(reusedTokenResponse.status).toBe(401);
  });

  it("enforces login rate limiting", async () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await loginPost(
        createPostRequest(
          "/api/auth/login",
          {
            email: "missing@example.com",
            password: "StrongPass123",
          },
          "10.10.10.10",
        ),
      );

      expect(response.status).toBe(401);
    }

    const blockedResponse = await loginPost(
      createPostRequest(
        "/api/auth/login",
        {
          email: "missing@example.com",
          password: "StrongPass123",
        },
        "10.10.10.10",
      ),
    );

    expect(blockedResponse.status).toBe(429);
    const blockedPayload = (await blockedResponse.json()) as {
      error: { code: string };
    };
    expect(blockedPayload.error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("protects non-auth route with JWT middleware", async () => {
    const registerResponse = await registerPost(
      createPostRequest("/api/auth/register", {
        email: "protected@example.com",
        password: "StrongPass123",
      }),
    );

    const registerPayload = (await registerResponse.json()) as {
      tokens: { accessToken: string };
    };

    const unauthorizedResponse = await meGet(createGetRequest("/api/users/me", undefined));
    expect(unauthorizedResponse.status).toBe(401);

    const authorizedResponse = await meGet(
      createGetRequest("/api/users/me", registerPayload.tokens.accessToken),
    );

    expect(authorizedResponse.status).toBe(200);
    const authorizedPayload = (await authorizedResponse.json()) as {
      user: { email: string };
    };
    expect(authorizedPayload.user.email).toBe("protected@example.com");
  });

  it("logs out and blocklists access and refresh tokens", async () => {
    const registerResponse = await registerPost(
      createPostRequest("/api/auth/register", {
        email: "logout@example.com",
        password: "StrongPass123",
      }),
    );

    const registerPayload = (await registerResponse.json()) as {
      tokens: { accessToken: string; refreshToken: string };
    };

    const logoutResponse = await logoutPost(
      createAuthenticatedPostRequest(
        "/api/auth/logout",
        { refreshToken: registerPayload.tokens.refreshToken },
        registerPayload.tokens.accessToken,
      ),
    );

    expect(logoutResponse.status).toBe(200);

    const meAfterLogout = await meGet(
      createGetRequest("/api/users/me", registerPayload.tokens.accessToken),
    );
    expect(meAfterLogout.status).toBe(401);

    const refreshAfterLogout = await refreshPost(
      createPostRequest("/api/auth/refresh", {
        refreshToken: registerPayload.tokens.refreshToken,
      }),
    );
    expect(refreshAfterLogout.status).toBe(401);
  });

  it("enforces per-user rate limit keys on authenticated routes", async () => {
    const registerAResponse = await registerPost(
      createPostRequest(
        "/api/auth/register",
        {
          email: "usera@example.com",
          password: "StrongPass123",
        },
        "20.20.20.20",
      ),
    );
    const registerAPayload = (await registerAResponse.json()) as {
      tokens: { accessToken: string };
    };

    const registerBResponse = await registerPost(
      createPostRequest(
        "/api/auth/register",
        {
          email: "userb@example.com",
          password: "StrongPass123",
        },
        "20.20.20.20",
      ),
    );
    const registerBPayload = (await registerBResponse.json()) as {
      tokens: { accessToken: string };
    };

    for (let call = 1; call <= 60; call += 1) {
      const response = await meGet(
        createGetRequest("/api/users/me", registerAPayload.tokens.accessToken, "20.20.20.20"),
      );
      expect(response.status).toBe(200);
    }

    const blockedAResponse = await meGet(
      createGetRequest("/api/users/me", registerAPayload.tokens.accessToken, "20.20.20.20"),
    );
    expect(blockedAResponse.status).toBe(429);

    const allowedBResponse = await meGet(
      createGetRequest("/api/users/me", registerBPayload.tokens.accessToken, "20.20.20.20"),
    );
    expect(allowedBResponse.status).toBe(200);
  });
});
