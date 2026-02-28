import { z } from "zod";

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50),
});

export const logWorkoutSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weight: z.number().positive(),
  date: z.string().datetime().optional(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type LogWorkoutInput = z.infer<typeof logWorkoutSchema>;
