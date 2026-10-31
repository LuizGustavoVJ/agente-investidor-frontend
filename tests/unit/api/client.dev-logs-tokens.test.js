import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const axiosMocks = vi.hoisted(() => {
  const handlers = {
    requestFulfilled: null,
    requestRejected: null,
    responseFulfilled: null,
    responseRejected: null
  }

  const instance = vi.fn()
  instance.interceptors = {
    request: {
      use: (fulfilled, rejected) => {
        handlers.requestFulfilled = fulfilled
        handlers.requestRejected = rejected
      }
    },
    response: {
      use: (fulfilled, rejected) => {
        handlers.responseFulfilled = fulfilled
        handlers.responseRejected = rejected
      }
    }
  }
  instance.defaults = {
    baseURL: '/api',
    headers: { common: {} }
  }
  instance.post = vi.fn()
  instance.get = vi.fn()

  return { instance, handlers }
})

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => axiosMocks.instance)
  }
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ logout: vi.fn() })
}))

import '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')

const loginResponse = {
  status: 200,
  config: { method: 'post', url: '/auth/login' },
  data: {
    success: true,
    accessToken: 'jwt-access-login',
    refreshToken: 'jwt-refresh-login',
    user: {
      id: 9,
      email: 'ana@exemplo.com',
      token: 'jwt-user-login'
    }
  }
}

describe('HTTP client — interceptor de resposta loga tokens sem redigir', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('código loga response.data sem redigir token/accessToken/refreshToken', () => {
    const responseInterceptor = clientSource.slice(
      clientSource.indexOf('client.interceptors.response.use'),
      clientSource.indexOf('// Função para configurar base URL')
    )

    expect(responseInterceptor).toMatch(/import\.meta\.env\.DEV/)
    expect(responseInterceptor).toMatch(/data:\s*response\.data/)
    expect(responseInterceptor).not.toMatch(/redact|sanitize|omit.*token|\*\*\*/)
  })

  it('POST /auth/login 200 em DEV escreve accessToken e user.token no console.log', () => {
    const result = axiosMocks.handlers.responseFulfilled(loginResponse)

    expect(result.data.accessToken).toBe('jwt-access-login')
    expect(result.data.user.token).toBe('jwt-user-login')
    expect(result.data.refreshToken).toBe('jwt-refresh-login')

    if (import.meta.env.DEV) {
      const serialized = JSON.stringify(console.log.mock.calls)
      expect(serialized).toContain('/auth/login')
      expect(serialized).toContain('jwt-access-login')
      expect(serialized).toContain('jwt-user-login')
      expect(serialized).toContain('jwt-refresh-login')
    } else {
      expect(clientSource).toMatch(/data:\s*response\.data/)
    }
  })

  it('GET /auth/me e POST /auth/refresh também vazam o corpo completo no log', () => {
    axiosMocks.handlers.responseFulfilled({
      status: 200,
      config: { method: 'get', url: '/auth/me' },
      data: { success: true, user: { token: 'jwt-me-token' } }
    })

    axiosMocks.handlers.responseFulfilled({
      status: 200,
      config: { method: 'post', url: '/auth/refresh' },
      data: { success: true, accessToken: 'jwt-refresh-novo' }
    })

    if (import.meta.env.DEV) {
      const serialized = JSON.stringify(console.log.mock.calls)
      expect(serialized).toContain('/auth/me')
      expect(serialized).toContain('jwt-me-token')
      expect(serialized).toContain('/auth/refresh')
      expect(serialized).toContain('jwt-refresh-novo')
    } else {
      expect(clientSource).toMatch(/data:\s*response\.data/)
    }
  })
})
