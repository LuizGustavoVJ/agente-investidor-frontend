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

describe('HTTP client — interceptor de request loga o corpo incluindo senha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('código loga config.data sem redigir password/credentials', () => {
    const requestInterceptor = clientSource.slice(
      clientSource.indexOf('client.interceptors.request.use'),
      clientSource.indexOf('client.interceptors.response.use')
    )

    expect(requestInterceptor).toMatch(/import\.meta\.env\.DEV/)
    expect(requestInterceptor).toMatch(/data:\s*config\.data/)
    expect(requestInterceptor).not.toMatch(/redact|sanitize|omit.*password|\*\*\*/)
  })

  it('POST /auth/login em DEV escreve a senha no console.log', () => {
    const config = {
      method: 'post',
      url: '/auth/login',
      headers: {},
      data: { email: 'ana@exemplo.com', password: 'senha-local-teste' }
    }

    const result = axiosMocks.handlers.requestFulfilled(config)

    expect(result.data.password).toBe('senha-local-teste')

    if (import.meta.env.DEV) {
      const serialized = JSON.stringify(console.log.mock.calls)
      expect(serialized).toContain('/auth/login')
      expect(serialized).toContain('senha-local-teste')
    } else {
      expect(clientSource).toMatch(/data:\s*config\.data/)
    }
  })
})
