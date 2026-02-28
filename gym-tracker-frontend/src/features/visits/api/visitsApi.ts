import { apiFetch } from '../../../utils/api'

interface LastVisitResponse {
  lastVisit: string | null
}

export function getLastVisit(): Promise<LastVisitResponse> {
  return apiFetch<LastVisitResponse>('/api/visits/last')
}
