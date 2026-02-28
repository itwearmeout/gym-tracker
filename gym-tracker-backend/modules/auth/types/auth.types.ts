export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResult {
  userId: string;
  email: string;
  tokens: AuthTokens;
}

export interface LoginResult {
  userId: string;
  email: string;
  tokens: AuthTokens;
}

export interface TokenRefreshResult {
  tokens: AuthTokens;
}

export interface LogoutResult {
  success: true;
}
