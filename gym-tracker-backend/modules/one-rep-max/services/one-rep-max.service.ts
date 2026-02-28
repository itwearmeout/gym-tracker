import prisma from "@/utils/prisma";
import { AppError } from "@/utils/errors";
import type {
  SetOneRepMaxTargetInput,
  UpdateOneRepMaxTargetInput,
} from "@/modules/one-rep-max/schemas/one-rep-max.schema";
import type { OneRepMaxRecord } from "@/modules/one-rep-max/types/one-rep-max.types";

export async function setOneRepMaxTarget(
  userId: string,
  input: SetOneRepMaxTargetInput,
): Promise<OneRepMaxRecord> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: input.exerciseId },
    select: { userId: true },
  });

  if (!exercise || exercise.userId !== userId) {
    throw new AppError(
      404,
      "EXERCISE_NOT_FOUND",
      "Exercise not found or does not belong to user.",
    );
  }

  return prisma.oneRepMax.create({
    data: {
      userId,
      exerciseId: input.exerciseId,
      weight: input.weight,
      date: input.date ? new Date(input.date) : undefined,
    },
  });
}

export async function updateOneRepMaxTarget(
  userId: string,
  exerciseId: string,
  input: UpdateOneRepMaxTargetInput,
): Promise<OneRepMaxRecord> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { userId: true },
  });

  if (!exercise || exercise.userId !== userId) {
    throw new AppError(
      404,
      "EXERCISE_NOT_FOUND",
      "Exercise not found or does not belong to user.",
    );
  }

  const existingTarget = await prisma.oneRepMax.findFirst({
    where: {
      userId,
      exerciseId,
    },
    orderBy: {
      date: "desc",
    },
  });

  if (!existingTarget) {
    throw new AppError(
      404,
      "TARGET_NOT_FOUND",
      "No 1RM target found for this exercise. Please set one first.",
    );
  }

  return prisma.oneRepMax.update({
    where: { id: existingTarget.id },
    data: {
      weight: input.weight,
      date: input.date ? new Date(input.date) : undefined,
    },
  });
}

export async function getOneRepMaxTargets(
  userId: string,
): Promise<OneRepMaxRecord[]> {
  return prisma.oneRepMax.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
  });
}

