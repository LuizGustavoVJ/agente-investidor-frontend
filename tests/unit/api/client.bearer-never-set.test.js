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

import { setAuthHeader } from '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const authStoreSource = readFileSync(resolve(__dirname, '../../../src/stores/auth.js'), 'utf8')

describe('HTTP client — token no sessionStorage nunca vira Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.getItem.mockReturnValue(
      JSON.stringify({ id: 9, email: 'ana@exemplo.com', token: 'jwt-sessao-abc' })
    )
    axiosMocks.instance.defaults.headers.common = {}
  })

  it('setAuthHeader existe, mas o interceptor de request não lê o token nem seta Bearer', () => {
    expect(typeof setAuthHeader).toBe('function')
    expect(clientSource).toMatch(/Authorization.*=.*Bearer/)
    expect(authStoreSource).not.toMatch(/setAuthHeader/)
    expect(authStoreSource).not.toMatch(/Authorization/)

    const interceptorBody = clientSource.slice(
      clientSource.indexOf('client.interceptors.request.use'),
      clientSource.indexOf('client.interceptors.response.use')
    )
    expect(interceptorBody).toMatch(/X-Requested-With/)
    expect(interceptorBody).not.toMatch(/Authorization/)
    expect(interceptorBody).not.toMatch(/sessionStorage/)
    expect(interceptorBody).not.toMatch(/Bearer/)
  })

  it('GET /portfolio/summary com user.token no sessionStorage sai sem Authorization', () => {
    const config = {
      method: 'get',
      url: '/portfolio/summary',
      headers: {}
    }

    const result = axiosMocks.handlers.requestFulfilled(config)

    expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest')
    expect(result.headers.Authorization).toBeUndefined()
    expect(result.headers.authorization).toBeUndefined()
    expect(sessionStorage.getItem).not.toHaveBeenCalled()
    expect(axiosMocks.instance.defaults.headers.common.Authorization).toBeUndefined()
  })

  it('setAuthHeader só altera o default se alguém chamar — login/checkAuth não chamam', () => {
    setAuthHeader('jwt-sessao-abc')
    expect(axiosMocks.instance.defaults.headers.common.Authorization).toBe('Bearer jwt-sessao-abc')

    setAuthHeader(null)
    expect(axiosMocks.instance.defaults.headers.common.Authorization).toBeUndefined()

    expect(authStoreSource).toMatch(/sessionStorage\.setItem\('user'/)
    expect(authStoreSource).not.toMatch(/setAuthHeader\(/)
  })
})
