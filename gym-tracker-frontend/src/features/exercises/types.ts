export interface Exercise {
  id: string
  name: string
  category: string
  userId: string
  createdAt: string
}

export interface WorkoutLog {
  id: string
  userId: string
  exerciseId: string
  sets: number
  reps: number
  weight: number
  date: string
}

export interface CreateExerciseInput {
  name: string
  category: string
}

export interface LogWorkoutInput {
  exerciseId: string
  sets: number
  reps: number
  weight: number
  date?: string
}
