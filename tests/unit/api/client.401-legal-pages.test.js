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

describe('HTTP client — 401 em páginas públicas legais e de ajuda', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
  })

  it.each(['/termos', '/privacidade', '/ajuda', '/sobre'])(
    '401 em %s (rota pública no router) faz logout e redireciona para /login',
    async (pathname) => {
      window.location.pathname = pathname
      window.location.href = `http://localhost:3000${pathname}`
      axiosMocks.instance.post.mockResolvedValue({ data: { success: false } })

      await expect(
        axiosMocks.handlers.responseRejected({
          config: { url: '/auth/me', method: 'get' },
          response: { status: 401, data: { message: 'expired' } }
        })
      ).rejects.toBeTruthy()

      expect(authStore.logout).toHaveBeenCalledTimes(1)
      expect(window.location.href).toBe('/login')
    }
  )

  it('401 em /login (allowlist) faz logout mas não redireciona', async () => {
    window.location.pathname = '/login'
    window.location.href = 'http://localhost:3000/login'
    axiosMocks.instance.post.mockResolvedValue({ data: { success: false } })

    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/auth/me', method: 'get' },
        response: { status: 401, data: { message: 'expired' } }
      })
    ).rejects.toBeTruthy()

    expect(authStore.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('http://localhost:3000/login')
  })
})
