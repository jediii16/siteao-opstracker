import { useEffect, useState, type ReactNode } from 'react'

import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
  type LoginCredentials,
  type UserRole,
} from '@/context/auth-context'
import { authService } from '@/services/authService'
import { setAuthenticationFailureHandler } from '@/services/api'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let active = true

    setAuthenticationFailureHandler(() => {
      if (active) {
        setUser(null)
      }
    })

    authService
      .refreshSession()
      .then((sessionUser) => {
        if (active) {
          setUser(sessionUser)
        }
      })
      .catch(() => {
        if (active) {
          setUser(null)
        }
      })
      .finally(() => {
        if (active) {
          setIsInitializing(false)
        }
      })

    return () => {
      active = false
      setAuthenticationFailureHandler(null)
    }
  }, [])

  async function login(credentials: LoginCredentials) {
    const authenticatedUser = await authService.login(credentials)
    setUser(authenticatedUser)
    return authenticatedUser
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }

  async function refreshSession() {
    try {
      const refreshedUser = await authService.refreshSession()
      setUser(refreshedUser)
      return refreshedUser
    } catch {
      setUser(null)
      return null
    }
  }

  function hasRole(...roles: UserRole[]) {
    return user !== null && roles.includes(user.role)
  }

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    isAuthenticated: user !== null,
    isInitializing,
    login,
    logout,
    refreshSession,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
