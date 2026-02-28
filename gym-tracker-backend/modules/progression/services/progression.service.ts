import prisma from "@/utils/prisma";

import type { ProgressionTimeframe } from "@/modules/progression/schemas/progression.schema";
import type {
  VolumeProgressionPoint,
  WorkoutFrequencyResult,
} from "@/modules/progression/types/progression.types";

function getTimeframeStart(timeframe: ProgressionTimeframe): Date | undefined {
  const now = Date.now();

  if (timeframe === "7d") {
    return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }

  if (timeframe === "30d") {
    return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }

  return undefined;
}

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function getVolumeProgression(
  userId: string,
  timeframe: ProgressionTimeframe,
): Promise<VolumeProgressionPoint[]> {
  const timeframeStart = getTimeframeStart(timeframe);

  const logs = await prisma.workoutLog.findMany({
    where: {
      userId,
      date: timeframeStart ? { gte: timeframeStart } : undefined,
    },
    select: {
      date: true,
      sets: true,
      reps: true,
      weight: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  const volumeByDate = new Map<string, number>();

  for (const log of logs) {
    const dateKey = toDateKey(log.date);
    const currentVolume = volumeByDate.get(dateKey) ?? 0;
    const logVolume = log.sets * log.reps * log.weight;
    volumeByDate.set(dateKey, currentVolume + logVolume);
  }

  return Array.from(volumeByDate.entries()).map(([dateKey, totalVolume]) => ({
    periodStart: new Date(`${dateKey}T00:00:00.000Z`),
    totalVolume,
  }));
}

export async function getWorkoutFrequency(
  userId: string,
  timeframe: ProgressionTimeframe,
): Promise<WorkoutFrequencyResult> {
  const timeframeStart = getTimeframeStart(timeframe);

  const logs = await prisma.workoutLog.findMany({
    where: {
      userId,
      date: timeframeStart ? { gte: timeframeStart } : undefined,
    },
    select: {
      date: true,
    },
  });

  const distinctDays = new Set<string>();

  for (const log of logs) {
    distinctDays.add(toDateKey(log.date));
  }

  return {
    timeframe,
    workoutCount: distinctDays.size,
  };
}
