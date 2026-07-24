import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios'

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _authRetry?: boolean
}

interface RefreshResponse {
  data: {
    accessToken: string
  }
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (!rawBaseUrl) {
  throw new Error(
    'VITE_API_BASE_URL is missing. Copy .env.example to .env and configure the backend /api URL.',
  )
}

function normalizeBaseUrl(value: string) {
  const normalized = value.replace(/\/+$/, '')

  if (normalized.startsWith('/')) {
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`
  }

  let url: URL

  try {
    url = new URL(normalized)
  } catch {
    throw new Error('VITE_API_BASE_URL must be an absolute HTTP(S) URL or a root-relative path.')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('VITE_API_BASE_URL must use the HTTP or HTTPS protocol.')
  }

  if (url.hostname.toLowerCase() === 'api') {
    throw new Error('VITE_API_BASE_URL cannot use the literal hostname "api".')
  }

  url.pathname = url.pathname.replace(/\/+$/, '')

  if (!url.pathname.endsWith('/api')) {
    url.pathname = `${url.pathname}/api`.replace(/\/{2,}/g, '/')
  }

  return url.toString().replace(/\/$/, '')
}

export const apiBaseUrl = normalizeBaseUrl(rawBaseUrl)

let accessToken: string | null = null
let refreshRequest: Promise<string> | null = null
let authenticationFailureHandler: (() => void) | null = null

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function setAuthenticationFailureHandler(handler: (() => void) | null) {
  authenticationFailureHandler = handler
}

function isAuthenticationEndpoint(url?: string) {
  return ['/auth/login', '/auth/refresh', '/auth/logout'].some((path) => url?.includes(path))
}

export function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = axios
      .post<RefreshResponse>(`${apiBaseUrl}/auth/refresh`, undefined, {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        const token = response.data.data.accessToken
        setAccessToken(token)
        return token
      })
      .catch((error: unknown) => {
        setAccessToken(null)
        authenticationFailureHandler?.()
        throw error
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._authRetry ||
      isAuthenticationEndpoint(originalRequest.url)
    ) {
      throw error
    }

    originalRequest._authRetry = true

    try {
      const token = await refreshAccessToken()
      originalRequest.headers = AxiosHeaders.from(originalRequest.headers)
      originalRequest.headers.set('Authorization', `Bearer ${token}`)
      return api(originalRequest)
    } catch {
      throw error
    }
  },
)

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (
    axios.isAxiosError<{
      message?: string
      errors?: Array<{ path?: string; message?: string }>
    }>(error)
  ) {
    const validationMessages = error.response?.data?.errors
      ?.map((validationError) => validationError.message?.trim())
      .filter((message): message is string => Boolean(message))

    if (validationMessages?.length) {
      return [...new Set(validationMessages)].slice(0, 3).join(' ')
    }

    return error.response?.data?.message ?? fallback
  }

  return error instanceof Error ? error.message : fallback
}

export async function getApiBlobErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<Blob>(error) || !(error.response?.data instanceof Blob)) {
    return getApiErrorMessage(error, fallback)
  }

  try {
    const body = await error.response.data.text()

    if (!body.trim()) {
      return fallback
    }

    const parsed: unknown = JSON.parse(body)

    if (typeof parsed === 'object' && parsed !== null) {
      const message = 'message' in parsed ? parsed.message : undefined

      if (typeof message === 'string' && message.trim()) {
        return message
      }

      const errors = 'errors' in parsed ? parsed.errors : undefined

      if (Array.isArray(errors)) {
        const messages = errors
          .map((entry) => {
            if (typeof entry !== 'object' || entry === null || !('message' in entry)) {
              return undefined
            }

            return typeof entry.message === 'string' ? entry.message.trim() : undefined
          })
          .filter((entryMessage): entryMessage is string => Boolean(entryMessage))

        if (messages.length) {
          return [...new Set(messages)].slice(0, 3).join(' ')
        }
      }
    }

    return body.length <= 240 ? body : fallback
  } catch {
    return fallback
  }
}
