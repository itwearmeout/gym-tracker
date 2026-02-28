import prisma from "@/utils/prisma";
import { AppError } from "@/utils/errors";

interface RateLimitInput {
  identifier?: string;
  userId?: string;
  endpoint: string;
  limit: number;
  windowSeconds: number;
}

function resolveRateLimitIdentifier(input: RateLimitInput): string {
  if (input.userId) {
    return `${input.userId}:${input.endpoint}`;
  }

  if (input.identifier) {
    return input.identifier;
  }

  throw new AppError(
    500,
    "CONFIGURATION_ERROR",
    "Rate limit requires either an identifier or a userId.",
  );
}

export async function enforceRateLimit(input: RateLimitInput): Promise<void> {
  const windowStart = new Date(Date.now() - input.windowSeconds * 1000);
  const identifier = resolveRateLimitIdentifier(input);

  const requestsInWindow = await prisma.rateLimit.count({
    where: {
      identifier,
      endpoint: input.endpoint,
      createdAt: { gte: windowStart },
    },
  });

  if (requestsInWindow >= input.limit) {
    throw new AppError(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many requests. Please try again later.",
    );
  }

  await prisma.rateLimit.create({
    data: {
      identifier,
      endpoint: input.endpoint,
    },
  });
}
