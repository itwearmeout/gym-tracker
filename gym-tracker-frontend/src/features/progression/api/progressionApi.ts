import { apiFetch } from '../../../utils/api'
import type { ProgressionResponse, ProgressionTimeframe } from '../types'

export function getProgression(timeframe: ProgressionTimeframe): Promise<ProgressionResponse> {
  return apiFetch<ProgressionResponse>(`/api/progression?timeframe=${timeframe}`)
}
