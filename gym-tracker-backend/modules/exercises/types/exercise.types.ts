export interface ExerciseRecord {
  id: string;
  name: string;
  category: string;
  userId: string;
  createdAt: Date;
}

export interface WorkoutLogRecord {
  id: string;
  userId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  date: Date;
}
