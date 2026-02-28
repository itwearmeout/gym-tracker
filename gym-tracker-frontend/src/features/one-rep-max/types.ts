export interface OneRepMaxTarget {
  id: string
  userId: string
  exerciseId: string
  weight: number
  date: string
}

export interface SetOneRepMaxInput {
  exerciseId: string
  weight: number
  date?: string
}

export interface UpdateOneRepMaxInput {
  weight: number
  date?: string
}
