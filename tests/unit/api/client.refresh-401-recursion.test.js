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

describe('HTTP client — 401 no /auth/refresh reentra no interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('refresh com 401 dispara outro POST /auth/refresh (o pedido de refresh não nasce com _retry)', async () => {
    let refreshPosts = 0

    axiosMocks.instance.post.mockImplementation(async (url) => {
      if (url !== '/auth/refresh') {
        return { data: { success: true } }
      }

      refreshPosts += 1
      if (refreshPosts > 3) {
        return Promise.reject(new Error('refresh recursion cap'))
      }

      const refreshError = {
        config: { url: '/auth/refresh' },
        response: { status: 401, data: { message: 'refresh expired' } }
      }
      return axiosMocks.handlers.responseRejected(refreshError)
    })

    await axiosMocks.handlers.responseRejected({
      config: { url: '/portfolio/summary' },
      response: { status: 401, data: { message: 'expired' } }
    }).catch(() => {})

    expect(refreshPosts).toBeGreaterThan(1)
    expect(axiosMocks.instance.post.mock.calls.filter(([url]) => url === '/auth/refresh').length)
      .toBeGreaterThan(1)
  })

  it('refresh 401 acaba em logout e redireciona /dashboard para /login', async () => {
    axiosMocks.instance.post.mockImplementation(async (url) => {
      if (url === '/auth/refresh') {
        return Promise.reject(new Error('refresh network'))
      }
      return { data: { success: true } }
    })

    await axiosMocks.handlers.responseRejected({
      config: { url: '/portfolio/summary' },
      response: { status: 401, data: { message: 'expired' } }
    }).catch(() => {})

    expect(authStore.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/login')
  })
})
