import { z } from "zod";

export const setOneRepMaxTargetSchema = z.object({
  exerciseId: z.string().uuid(),
  weight: z.number().positive(),
  date: z.string().datetime().optional(),
});

export const updateOneRepMaxTargetSchema = z.object({
  weight: z.number().positive(),
  date: z.string().datetime().optional(),
});

export const oneRepMaxParamsSchema = z.object({
  exerciseId: z.string().uuid(),
});

export type SetOneRepMaxTargetInput = z.infer<typeof setOneRepMaxTargetSchema>;
export type UpdateOneRepMaxTargetInput = z.infer<typeof updateOneRepMaxTargetSchema>;
export type OneRepMaxParamsInput = z.infer<typeof oneRepMaxParamsSchema>;
