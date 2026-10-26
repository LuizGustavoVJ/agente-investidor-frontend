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

describe('HTTP client — retry 401 após refresh ok não encerra a sessão', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('refresh 200 + retry 401 não chama logout: _retry já true sai do interceptor', async () => {
    axiosMocks.instance.post.mockResolvedValue({ data: { success: true } })
    axiosMocks.instance.mockImplementation(async (config) => {
      return axiosMocks.handlers.responseRejected({
        config,
        response: { status: 401, data: { message: 'still expired' } }
      })
    })

    const original = { url: '/portfolio/summary', method: 'get' }

    await axiosMocks.handlers.responseRejected({
      config: original,
      response: { status: 401, data: { message: 'expired' } }
    }).catch(() => {})

    expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1)
    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(axiosMocks.instance).toHaveBeenCalledWith(original)
    expect(original._retry).toBe(true)
    expect(authStore.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/dashboard')
  })

  it('refresh 200 + retry 401 em /corretoras também mantém a sessão local', async () => {
    window.location.pathname = '/corretoras'
    window.location.href = 'http://localhost:3000/corretoras'
    axiosMocks.instance.post.mockResolvedValue({ data: { success: true } })
    axiosMocks.instance.mockImplementation(async (config) => {
      return axiosMocks.handlers.responseRejected({
        config,
        response: { status: 401 }
      })
    })

    await axiosMocks.handlers.responseRejected({
      config: { url: '/brokers/connected' },
      response: { status: 401 }
    }).catch(() => {})

    expect(authStore.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/corretoras')
    expect(window.location.pathname).toBe('/corretoras')
  })
})
