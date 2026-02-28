// Centralized API fetch wrapper
export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('accessToken')
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && typeof init.body === 'object' && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
    init.body = JSON.stringify(init.body)
  }
  const response = await fetch(input, { ...init, headers })
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json()
}
