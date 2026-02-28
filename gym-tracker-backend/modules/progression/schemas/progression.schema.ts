import { z } from "zod";

export const progressionTimeframeSchema = z.enum(["7d", "30d", "all"]);

export const progressionQuerySchema = z.object({
  timeframe: progressionTimeframeSchema.optional().default("30d"),
});

export type ProgressionTimeframe = z.infer<typeof progressionTimeframeSchema>;
export type ProgressionQueryInput = z.infer<typeof progressionQuerySchema>;
