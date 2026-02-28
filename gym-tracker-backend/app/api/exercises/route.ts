import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/modules/auth/services/auth-middleware.service";
import { enforceRateLimit } from "@/modules/auth/services/rate-limit.service";
import { createExerciseSchema } from "@/modules/exercises/schemas/exercise.schema";
import { createExercise, getExercises } from "@/modules/exercises/services/exercise.service";
import { createErrorResponse, parseJsonSafely } from "@/utils/api-error-response";
import { AppError } from "@/utils/errors";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireAuthenticatedUser(request);

    await enforceRateLimit({
      userId: user.userId,
      endpoint: "exercises/create",
      limit: 20,
      windowSeconds: 60,
    });

    const rawBody = await request.text();
    const requestBody = parseJsonSafely(rawBody);
    const validationResult = createExerciseSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid create exercise payload.");
    }

    const result = await createExercise(user.userId, validationResult.data);
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
      endpoint: "exercises/list",
      limit: 100,
      windowSeconds: 60,
    });

    const result = await getExercises(user.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
