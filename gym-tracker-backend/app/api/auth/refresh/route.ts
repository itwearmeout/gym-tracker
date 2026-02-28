import { NextResponse } from "next/server";

import { tokenRefreshSchema } from "@/modules/auth/schemas/auth.schema";
import { refreshAuthToken } from "@/modules/auth/services/auth.service";
import { enforceRateLimit } from "@/modules/auth/services/rate-limit.service";
import { createErrorResponse, parseJsonSafely } from "@/utils/api-error-response";
import { AppError } from "@/utils/errors";
import { getRequestIdentifier } from "@/utils/request";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await enforceRateLimit({
      identifier: getRequestIdentifier(request),
      endpoint: "auth/refresh",
      limit: 30,
      windowSeconds: 60,
    });

    const rawBody = await request.text();
    const requestBody = parseJsonSafely(rawBody);
    const validationResult = tokenRefreshSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid token refresh payload.");
    }

    const result = await refreshAuthToken(validationResult.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
