export interface VolumeProgressionPoint {
  periodStart: Date;
  totalVolume: number;
}

export interface WorkoutFrequencyResult {
  timeframe: "7d" | "30d" | "all";
  workoutCount: number;
}
