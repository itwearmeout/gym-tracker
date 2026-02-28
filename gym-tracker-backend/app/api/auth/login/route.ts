import { NextResponse } from "next/server";

import { loginSchema } from "@/modules/auth/schemas/auth.schema";
import { loginUser } from "@/modules/auth/services/auth.service";
import { enforceRateLimit } from "@/modules/auth/services/rate-limit.service";
import { createErrorResponse, parseJsonSafely } from "@/utils/api-error-response";
import { AppError } from "@/utils/errors";
import { getRequestIdentifier } from "@/utils/request";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await enforceRateLimit({
      identifier: getRequestIdentifier(request),
      endpoint: "auth/login",
      limit: 10,
      windowSeconds: 60,
    });

    const rawBody = await request.text();
    const requestBody = parseJsonSafely(rawBody);
    const validationResult = loginSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid login request payload.");
    }

    const result = await loginUser(validationResult.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
