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

describe('HTTP client — 403 não pode ser tratado como sessão expirada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('403 em endpoint autenticado não dispara refresh, logout nem redirect', async () => {
    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/brokers/connected', method: 'get' },
        response: { status: 403, data: { message: 'Acesso negado' } }
      })
    ).rejects.toBeTruthy()

    expect(axiosMocks.instance.post).not.toHaveBeenCalled()
    expect(authStore.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/dashboard')
  })

  it('500 também não invalida a sessão', async () => {
    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/portfolio/summary', method: 'get' },
        response: { status: 500, data: { message: 'Erro interno' } }
      })
    ).rejects.toBeTruthy()

    expect(authStore.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/dashboard')
  })
})
