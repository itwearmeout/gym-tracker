import { useContext } from 'react'
import { AuthStateContext, type AuthContextType } from './AuthStateContext'

export function useAuth(): AuthContextType {
  const context = useContext(AuthStateContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
