import { apiFetch } from '../../../utils/api'
import type {
  OneRepMaxTarget,
  SetOneRepMaxInput,
  UpdateOneRepMaxInput,
} from '../types'

export function getOneRepMaxTargets(): Promise<OneRepMaxTarget[]> {
  return apiFetch<OneRepMaxTarget[]>('/api/one-rep-max')
}

export function setOneRepMaxTarget(input: SetOneRepMaxInput): Promise<OneRepMaxTarget> {
  return apiFetch<OneRepMaxTarget>('/api/one-rep-max', {
    method: 'POST',
    body: input,
  })
}

export function updateOneRepMaxTarget(
  exerciseId: string,
  input: UpdateOneRepMaxInput,
): Promise<OneRepMaxTarget> {
  return apiFetch<OneRepMaxTarget>(`/api/one-rep-max/${exerciseId}`, {
    method: 'PATCH',
    body: input,
  })
}
