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

describe('HTTP client — 403 não encerra sessão nem redireciona', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('403 em /portfolio/summary no dashboard não chama logout nem /auth/refresh', async () => {
    await axiosMocks.handlers.responseRejected({
      config: { url: '/portfolio/summary', method: 'get' },
      response: { status: 403, data: { message: 'sem permissão para a carteira' } }
    }).catch(() => {})

    expect(axiosMocks.instance.post).not.toHaveBeenCalled()
    expect(authStore.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/dashboard')
    expect(window.location.pathname).toBe('/dashboard')
  })

  it('403 em /configuracoes também mantém a sessão local', async () => {
    window.location.pathname = '/configuracoes'
    window.location.href = 'http://localhost:3000/configuracoes'

    await axiosMocks.handlers.responseRejected({
      config: { url: '/auth/security', method: 'get' },
      response: { status: 403, data: { message: '2FA obrigatório' } }
    }).catch(() => {})

    expect(authStore.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/configuracoes')
    expect(window.location.pathname).toBe('/configuracoes')
  })
})
