import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/modules/auth/services/auth-middleware.service";
import { enforceRateLimit } from "@/modules/auth/services/rate-limit.service";
import { getLastVisit } from "@/modules/visits/services/visit.service";
import { createErrorResponse } from "@/utils/api-error-response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await requireAuthenticatedUser(request);

    await enforceRateLimit({
      userId: user.userId,
      endpoint: "visits/last",
      limit: 60,
      windowSeconds: 60,
    });

    const result = await getLastVisit(user.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
