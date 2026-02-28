import { createContext, useContext, useState, type ReactNode } from 'react'
import { apiFetch } from '../../../utils/api'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  login: (credentials: Record<string, any>) => Promise<void>
  register: (credentials: Record<string, any>) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  const login = async (credentials: Record<string, any>) => {
    const data = await apiFetch('/api/auth/login', { method: 'POST', body: credentials as unknown as BodyInit })
    localStorage.setItem('accessToken', data.tokens.accessToken)
    
    setUser({ id: data.userId, email: data.email })
    
    setIsAuthenticated(true)
  }

  const register = async (credentials: Record<string, any>) => {
    const data = await apiFetch('/api/auth/register', { method: 'POST', body: credentials as unknown as BodyInit })
    localStorage.setItem('accessToken', data.tokens.accessToken)
    
    setUser({ id: data.userId, email: data.email })
    
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  const contextValue: AuthContextType = { user, isAuthenticated, login, register, logout }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
