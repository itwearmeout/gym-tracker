export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface ApiFetchOptions {
  skipAuth?: boolean
  retryOnUnauthorized?: boolean
}

type ApiRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown
}

interface TokenPair {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function normalizeBody(body: unknown, headers: Headers): BodyInit | null | undefined {
  if (!body) {
    return body as null | undefined
  }

  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body as BodyInit
  }

  headers.set('Content-Type', 'application/json')
  return JSON.stringify(body)
}

async function parseResponse<T>(response: Response): Promise<T> {
  const hasJsonBody = response.headers.get('content-type')?.includes('application/json')
  const payload = hasJsonBody ? await response.json() : null

  if (!response.ok) {
    const message = payload?.error?.message ?? `Request failed with status ${response.status}`
    const code = payload?.error?.code
    throw new ApiError(message, response.status, code)
  }

  return payload as T
}

let refreshPromise: Promise<void> | null = null

async function refreshAccessToken(): Promise<void> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new ApiError('Missing refresh token.', 401, 'MISSING_REFRESH_TOKEN')
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await apiFetch<{ tokens: TokenPair }>(
        '/api/auth/refresh',
        {
          method: 'POST',
          body: { refreshToken },
        },
        {
          skipAuth: true,
          retryOnUnauthorized: false,
        },
      )

      setTokens(response.tokens)
    })().finally(() => {
      refreshPromise = null
    })
  }

  await refreshPromise
}

export async function apiFetch<T>(
  input: RequestInfo,
  init: ApiRequestInit = {},
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuth = false, retryOnUnauthorized = true } = options
  const headers = new Headers(init.headers)

  if (!skipAuth) {
    const accessToken = getAccessToken()
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  const body = normalizeBody(init.body, headers)
  const response = await fetch(input, { ...init, headers, body })

  try {
    return await parseResponse<T>(response)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && retryOnUnauthorized && !skipAuth) {
      await refreshAccessToken()

      return apiFetch<T>(input, init, {
        skipAuth: false,
        retryOnUnauthorized: false,
      })
    }

    throw error
  }
}
