export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthPayload {
  userId: string
  email: string
  tokens: AuthTokens
}

export interface UserProfile {
  id: string
  email: string
}

export interface AuthCredentials {
  email: string
  password: string
}
