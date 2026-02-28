import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/modules/auth/services/auth-middleware.service";
import { enforceRateLimit } from "@/modules/auth/services/rate-limit.service";
import { oneRepMaxParamsSchema, updateOneRepMaxTargetSchema } from "@/modules/one-rep-max/schemas/one-rep-max.schema";
import { updateOneRepMaxTarget } from "@/modules/one-rep-max/services/one-rep-max.service";
import { createErrorResponse, parseJsonSafely } from "@/utils/api-error-response";
import { AppError } from "@/utils/errors";

interface RouteContext {
  params: Promise<{ exerciseId: string }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const user = await requireAuthenticatedUser(request);

    const { exerciseId } = await context.params;
    const paramsValidation = oneRepMaxParamsSchema.safeParse({ exerciseId });
    if (!paramsValidation.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid exercise ID parameter.");
    }

    await enforceRateLimit({
      userId: user.userId,
      endpoint: `one-rep-max/update/${exerciseId}`,
      limit: 20,
      windowSeconds: 60,
    });

    const rawBody = await request.text();
    const requestBody = parseJsonSafely(rawBody);
    const validationResult = updateOneRepMaxTargetSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid update 1RM target payload.");
    }

    const result = await updateOneRepMaxTarget(user.userId, exerciseId, validationResult.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return createErrorResponse(error);
  }
}

