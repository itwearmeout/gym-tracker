import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/modules/auth/services/auth-middleware.service";
import { enforceRateLimit } from "@/modules/auth/services/rate-limit.service";
import { setOneRepMaxTargetSchema } from "@/modules/one-rep-max/schemas/one-rep-max.schema";
import { setOneRepMaxTarget, getOneRepMaxTargets } from "@/modules/one-rep-max/services/one-rep-max.service";
import { createErrorResponse, parseJsonSafely } from "@/utils/api-error-response";
import { AppError } from "@/utils/errors";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireAuthenticatedUser(request);

    await enforceRateLimit({
      userId: user.userId,
      endpoint: "one-rep-max/set",
      limit: 20,
      windowSeconds: 60,
    });

    const rawBody = await request.text();
    const requestBody = parseJsonSafely(rawBody);
    const validationResult = setOneRepMaxTargetSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid set 1RM target payload.");
    }

    const result = await setOneRepMaxTarget(user.userId, validationResult.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await requireAuthenticatedUser(request);

    await enforceRateLimit({
      userId: user.userId,
      endpoint: "one-rep-max/list",
      limit: 60,
      windowSeconds: 60,
    });

    const result = await getOneRepMaxTargets(user.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
