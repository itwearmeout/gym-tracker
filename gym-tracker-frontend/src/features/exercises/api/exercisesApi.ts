import { apiFetch } from '../../../utils/api'
import type {
  CreateExerciseInput,
  Exercise,
  LogWorkoutInput,
  WorkoutLog,
} from '../types'

export function getExercises(): Promise<Exercise[]> {
  return apiFetch<Exercise[]>('/api/exercises')
}

export function createExercise(input: CreateExerciseInput): Promise<Exercise> {
  return apiFetch<Exercise>('/api/exercises', {
    method: 'POST',
    body: input,
  })
}

export function getWorkoutLogs(exerciseId?: string): Promise<WorkoutLog[]> {
  const query = exerciseId ? `?exerciseId=${encodeURIComponent(exerciseId)}` : ''
  return apiFetch<WorkoutLog[]>(`/api/exercises/logs${query}`)
}

export function logWorkout(input: LogWorkoutInput): Promise<WorkoutLog> {
  return apiFetch<WorkoutLog>('/api/exercises/logs', {
    method: 'POST',
    body: input,
  })
}
