import type { ReactNode } from 'react'

import { AuthContext, type AuthContextValue } from '@/context/auth-context'

interface AuthProviderProps {
  children: ReactNode
}

const placeholderAuth: AuthContextValue = {
  user: null,
  isAuthenticated: false,
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthContext.Provider value={placeholderAuth}>{children}</AuthContext.Provider>
}
