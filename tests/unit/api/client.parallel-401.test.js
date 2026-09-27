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

describe('HTTP client — 401 paralelo sem single-flight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('dois 401 simultâneos disparam dois POST /auth/refresh (não há single-flight)', async () => {
    const reqA = { url: '/portfolio/summary', _retry: false }
    const reqB = { url: '/portfolio/assets', _retry: false }

    axiosMocks.instance.post.mockResolvedValue({ data: { success: true } })
    axiosMocks.instance.mockResolvedValue({ data: { ok: true } })

    await Promise.all([
      axiosMocks.handlers.responseRejected({
        config: reqA,
        response: { status: 401, data: { message: 'expired' } }
      }),
      axiosMocks.handlers.responseRejected({
        config: reqB,
        response: { status: 401, data: { message: 'expired' } }
      })
    ])

    expect(axiosMocks.instance.post).toHaveBeenCalledTimes(2)
    expect(axiosMocks.instance.post).toHaveBeenNthCalledWith(1, '/auth/refresh')
    expect(axiosMocks.instance.post).toHaveBeenNthCalledWith(2, '/auth/refresh')
    expect(authStore.logout).not.toHaveBeenCalled()
  })

  it('se um dos refresh paralelos falha, logout corre mesmo com o outro refresh tendo renovado o token', async () => {
    const reqA = { url: '/portfolio/summary', _retry: false }
    const reqB = { url: '/analysis/alerts', _retry: false }

    let refreshCalls = 0
    axiosMocks.instance.post.mockImplementation(() => {
      refreshCalls += 1
      if (refreshCalls === 1) {
        return Promise.resolve({ data: { success: true } })
      }
      return Promise.reject(new Error('refresh race'))
    })
    axiosMocks.instance.mockResolvedValue({ data: { ok: true } })

    await Promise.allSettled([
      axiosMocks.handlers.responseRejected({
        config: reqA,
        response: { status: 401, data: { message: 'expired' } }
      }),
      axiosMocks.handlers.responseRejected({
        config: reqB,
        response: { status: 401, data: { message: 'expired' } }
      })
    ])

    expect(axiosMocks.instance.post).toHaveBeenCalledTimes(2)
    expect(authStore.logout).toHaveBeenCalledTimes(1)
  })
})
