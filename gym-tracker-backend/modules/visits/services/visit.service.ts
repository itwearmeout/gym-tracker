import prisma from "@/utils/prisma";

export async function getLastVisit(userId: string): Promise<{ lastVisit: Date | null }> {
  const lastWorkout = await prisma.workoutLog.findFirst({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
    select: {
      date: true,
    },
  });

  return {
    lastVisit: lastWorkout?.date || null,
  };
}
