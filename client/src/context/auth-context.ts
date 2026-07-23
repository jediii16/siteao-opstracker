import { createContext } from 'react'

export type UserRole = 'logistics' | 'committee'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
}

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
