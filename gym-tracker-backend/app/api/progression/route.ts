import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/modules/auth/services/auth-middleware.service";
import { enforceRateLimit } from "@/modules/auth/services/rate-limit.service";
import { progressionQuerySchema } from "@/modules/progression/schemas/progression.schema";
import {
  getVolumeProgression,
  getWorkoutFrequency,
} from "@/modules/progression/services/progression.service";
import { createErrorResponse } from "@/utils/api-error-response";
import { AppError } from "@/utils/errors";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await requireAuthenticatedUser(request);

    await enforceRateLimit({
      userId: user.userId,
      endpoint: "progression/read",
      limit: 60,
      windowSeconds: 60,
    });

    const { searchParams } = new URL(request.url);
    const timeframeParam = searchParams.get("timeframe") ?? undefined;
    const validationResult = progressionQuerySchema.safeParse({
      timeframe: timeframeParam,
    });

    if (!validationResult.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid progression query parameters.",
      );
    }

    const timeframe = validationResult.data.timeframe;

    const [volumeProgression, workoutFrequency] = await Promise.all([
      getVolumeProgression(user.userId, timeframe),
      getWorkoutFrequency(user.userId, timeframe),
    ]);

    return NextResponse.json(
      {
        timeframe,
        volumeProgression,
        workoutFrequency,
      },
      { status: 200 },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
