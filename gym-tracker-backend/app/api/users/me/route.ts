import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/modules/auth/services/auth-middleware.service";
import { enforceRateLimit } from "@/modules/auth/services/rate-limit.service";
import { createErrorResponse } from "@/utils/api-error-response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await requireAuthenticatedUser(request);

    await enforceRateLimit({
      userId: user.userId,
      endpoint: "users/me",
      limit: 60,
      windowSeconds: 60,
    });

    return NextResponse.json(
      {
        user: {
          id: user.userId,
          email: user.email,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
