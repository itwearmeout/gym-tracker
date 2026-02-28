import { NextResponse } from "next/server";

import { AppError, isAppError } from "@/utils/errors";

export function createErrorResponse(error: unknown): NextResponse {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    },
    { status: 500 },
  );
}

export function parseJsonSafely(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}
