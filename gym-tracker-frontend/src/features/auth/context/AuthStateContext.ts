import { createContext } from 'react'
import type { AuthCredentials, UserProfile } from '../types'

export interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (credentials: AuthCredentials) => Promise<void>
  register: (credentials: AuthCredentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthStateContext = createContext<AuthContextType | undefined>(undefined)
