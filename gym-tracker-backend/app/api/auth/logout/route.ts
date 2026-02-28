import { NextResponse } from "next/server";

import { logoutSchema } from "@/modules/auth/schemas/auth.schema";
import { logoutUser } from "@/modules/auth/services/auth.service";
import {
  getBearerTokenFromRequest,
  requireAuthenticatedUser,
} from "@/modules/auth/services/auth-middleware.service";
import { enforceRateLimit } from "@/modules/auth/services/rate-limit.service";
import { createErrorResponse, parseJsonSafely } from "@/utils/api-error-response";
import { AppError } from "@/utils/errors";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireAuthenticatedUser(request);

    await enforceRateLimit({
      userId: user.userId,
      endpoint: "auth/logout",
      limit: 20,
      windowSeconds: 60,
    });

    const rawBody = await request.text();
    const requestBody = parseJsonSafely(rawBody);
    const validationResult = logoutSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid logout payload.");
    }

    const accessToken = getBearerTokenFromRequest(request);
    const result = await logoutUser(validationResult.data, accessToken, user.userId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
