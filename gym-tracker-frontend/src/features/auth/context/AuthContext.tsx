import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/authApi'
import type { AuthCredentials, UserProfile } from '../types'
import { ApiError, clearTokens, getRefreshToken, setTokens } from '../../../utils/api'
import { AuthStateContext, type AuthContextType } from './AuthStateContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    async function bootstrapSession(): Promise<void> {
      try {
        const me = await getMe()
        setUser(me.user)
        setIsAuthenticated(true)
      } catch {
        clearTokens()
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsBootstrapping(false)
      }
    }

    bootstrapSession()
  }, [])

  const login = async (credentials: AuthCredentials): Promise<void> => {
    const data = await loginRequest(credentials)
    setTokens(data.tokens)
    setUser({ id: data.userId, email: data.email })
    setIsAuthenticated(true)
  }

  const register = async (credentials: AuthCredentials): Promise<void> => {
    const data = await registerRequest(credentials)
    setTokens(data.tokens)
    setUser({ id: data.userId, email: data.email })
    setIsAuthenticated(true)
  }

  const logout = async (): Promise<void> => {
    const refreshToken = getRefreshToken()

    if (refreshToken) {
      try {
        await logoutRequest(refreshToken)
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error
        }
      }
    }

    clearTokens()
    setUser(null)
    setIsAuthenticated(false)
  }

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isBootstrapping,
    login,
    register,
    logout,
  }

  return <AuthStateContext.Provider value={contextValue}>{children}</AuthStateContext.Provider>
}
