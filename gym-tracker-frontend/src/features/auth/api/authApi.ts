import { apiFetch } from '../../../utils/api'
import type { AuthCredentials, AuthPayload, AuthTokens, UserProfile } from '../types'

interface RefreshResponse {
  tokens: AuthTokens
}

interface LogoutResponse {
  success: true
}

interface MeResponse {
  user: UserProfile
}

export function register(credentials: AuthCredentials): Promise<AuthPayload> {
  return apiFetch<AuthPayload>('/api/auth/register', {
    method: 'POST',
    body: credentials,
  })
}

export function login(credentials: AuthCredentials): Promise<AuthPayload> {
  return apiFetch<AuthPayload>('/api/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export function refresh(refreshToken: string): Promise<RefreshResponse> {
  return apiFetch<RefreshResponse>(
    '/api/auth/refresh',
    {
      method: 'POST',
      body: { refreshToken },
    },
    {
      skipAuth: true,
      retryOnUnauthorized: false,
    },
  )
}

export function logout(refreshToken: string): Promise<LogoutResponse> {
  return apiFetch<LogoutResponse>('/api/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  })
}

export function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/api/users/me')
}
