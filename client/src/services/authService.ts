import type { AuthUser, LoginCredentials } from '@/context/auth-context'
import { api, refreshAccessToken, setAccessToken } from '@/services/api'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface AuthenticationData {
  accessToken: string
  user: AuthUser
}

async function getCurrentUser() {
  const response = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me')
  return response.data.data.user
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post<ApiResponse<AuthenticationData>>('/auth/login', credentials)
    setAccessToken(response.data.data.accessToken)
    return response.data.data.user
  },

  getCurrentUser,

  async refreshSession() {
    await refreshAccessToken()
    return getCurrentUser()
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },
}
