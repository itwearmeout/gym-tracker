import prisma from "@/utils/prisma";
import { AppError } from "@/utils/errors";
import type {
  CreateExerciseInput,
  LogWorkoutInput,
} from "@/modules/exercises/schemas/exercise.schema";
import type {
  ExerciseRecord,
  WorkoutLogRecord,
} from "@/modules/exercises/types/exercise.types";

export async function createExercise(
  userId: string,
  input: CreateExerciseInput,
): Promise<ExerciseRecord> {
  const existingExercise = await prisma.exercise.findUnique({
    where: {
      name_userId: {
        name: input.name,
        userId,
      },
    },
    select: { id: true },
  });

  if (existingExercise) {
    throw new AppError(409, "EXERCISE_ALREADY_EXISTS", "Exercise with this name already exists for this user.");
  }

  return prisma.exercise.create({
    data: {
      name: input.name,
      category: input.category,
      userId,
    },
  });
}

export async function logWorkout(
  userId: string,
  input: LogWorkoutInput,
): Promise<WorkoutLogRecord> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: input.exerciseId },
    select: { userId: true },
  });

  if (!exercise || exercise.userId !== userId) {
    throw new AppError(404, "EXERCISE_NOT_FOUND", "Exercise not found or does not belong to user.");
  }

  return prisma.workoutLog.create({
    data: {
      userId,
      exerciseId: input.exerciseId,
      sets: input.sets,
      reps: input.reps,
      weight: input.weight,
      date: input.date ? new Date(input.date) : undefined,
    },
  });
}

export async function getExercises(userId: string): Promise<ExerciseRecord[]> {
  return prisma.exercise.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkoutLogs(
  userId: string,
  exerciseId?: string,
): Promise<WorkoutLogRecord[]> {
  return prisma.workoutLog.findMany({
    where: {
      userId,
      exerciseId: exerciseId || undefined,
    },
    orderBy: { date: "desc" },
  });
}
