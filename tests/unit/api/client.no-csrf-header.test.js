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

  const createConfig = { captured: null }
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
    headers: { common: {} },
    withCredentials: true
  }
  instance.post = vi.fn()
  instance.get = vi.fn()

  return { instance, handlers, createConfig }
})

vi.mock('axios', () => ({
  default: {
    create: vi.fn((config) => {
      axiosMocks.createConfig.captured = config
      return axiosMocks.instance
    })
  }
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ logout: vi.fn() })
}))

import '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')

describe('HTTP client — cookie auth sem header CSRF nas mutações', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create usa withCredentials e não configura xsrfCookieName/xsrfHeaderName', () => {
    expect(clientSource).toMatch(/withCredentials:\s*true/)
    expect(clientSource).not.toMatch(/xsrfCookieName|xsrfHeaderName|X-CSRF|X-XSRF|csrf/i)
    expect(axiosMocks.createConfig.captured.withCredentials).toBe(true)
    expect(axiosMocks.createConfig.captured.xsrfCookieName).toBeUndefined()
    expect(axiosMocks.createConfig.captured.xsrfHeaderName).toBeUndefined()
  })

  it('interceptor de request só seta X-Requested-With — POST autenticado sai sem CSRF', () => {
    const requestInterceptor = clientSource.slice(
      clientSource.indexOf('client.interceptors.request.use'),
      clientSource.indexOf('client.interceptors.response.use')
    )

    expect(requestInterceptor).toMatch(/X-Requested-With/)
    expect(requestInterceptor).not.toMatch(/CSRF|XSRF|csrf/i)

    const config = {
      method: 'post',
      url: '/portfolio/sync',
      headers: {},
      data: {}
    }

    const result = axiosMocks.handlers.requestFulfilled(config)

    expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest')
    expect(result.headers['X-CSRF-Token']).toBeUndefined()
    expect(result.headers['X-XSRF-TOKEN']).toBeUndefined()
    expect(result.headers['X-CSRF-TOKEN']).toBeUndefined()
  })

  it('PUT /auth/password e DELETE /brokers/disconnect também não recebem CSRF', () => {
    const password = axiosMocks.handlers.requestFulfilled({
      method: 'put',
      url: '/auth/password',
      headers: {},
      data: { currentPassword: 'antiga', newPassword: 'nova-senha' }
    })
    const disconnect = axiosMocks.handlers.requestFulfilled({
      method: 'delete',
      url: '/brokers/disconnect/xp-acc-1',
      headers: {}
    })

    expect(password.headers['X-CSRF-Token']).toBeUndefined()
    expect(password.headers['X-XSRF-TOKEN']).toBeUndefined()
    expect(disconnect.headers['X-CSRF-Token']).toBeUndefined()
    expect(disconnect.headers['X-XSRF-TOKEN']).toBeUndefined()
  })
})
