export type ProgressionTimeframe = '7d' | '30d' | 'all'

export interface VolumeProgressionPoint {
  periodStart: string
  totalVolume: number
}

export interface WorkoutFrequency {
  timeframe: ProgressionTimeframe
  workoutCount: number
}

export interface ProgressionResponse {
  timeframe: ProgressionTimeframe
  volumeProgression: VolumeProgressionPoint[]
  workoutFrequency: WorkoutFrequency
}
