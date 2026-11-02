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

const authStore = vi.hoisted(() => ({
  logout: vi.fn()
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore
}))

import '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const loginSource = readFileSync(resolve(__dirname, '../../../src/components/Login.vue'), 'utf8')

describe('HTTP client — 429 e 423 não aplicam cooldown nem leem Retry-After', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/login'
    window.location.href = 'http://localhost:3000/login'
  })

  it('código do interceptor e do Login ignoram 429/423/Retry-After', () => {
    const responseInterceptor = clientSource.slice(
      clientSource.indexOf('client.interceptors.response.use'),
      clientSource.indexOf('// Função para configurar base URL')
    )

    expect(responseInterceptor).toMatch(/status === 401/)
    expect(responseInterceptor).toMatch(/status === 403/)
    expect(responseInterceptor).toMatch(/status >= 500/)
    expect(responseInterceptor).not.toMatch(/429|423|Retry-After|rateLimit|lockout|cooldown/)

    expect(loginSource).not.toMatch(/429|423|Retry-After|lockout|cooldown/)
  })

  it('429 em POST /auth/login não chama refresh, logout nem redireciona', async () => {
    await axiosMocks.handlers.responseRejected({
      config: { url: '/auth/login', method: 'post' },
      response: {
        status: 429,
        headers: { 'retry-after': '60' },
        data: { message: 'demasiadas tentativas de login' }
      }
    }).catch(() => {})

    expect(axiosMocks.instance.post).not.toHaveBeenCalled()
    expect(authStore.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/login')
    expect(window.location.pathname).toBe('/login')
  })

  it('423 em GET /auth/me no dashboard também mantém a sessão local', async () => {
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'

    await axiosMocks.handlers.responseRejected({
      config: { url: '/auth/me', method: 'get' },
      response: {
        status: 423,
        headers: { 'Retry-After': '120' },
        data: { message: 'conta bloqueada' }
      }
    }).catch(() => {})

    expect(axiosMocks.instance.post).not.toHaveBeenCalled()
    expect(authStore.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/dashboard')
    expect(window.location.pathname).toBe('/dashboard')
  })
})
