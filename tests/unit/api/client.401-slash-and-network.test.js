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

describe('HTTP client — 401 com trailing slash e erro de rede', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('401 em /login/ (barra extra) faz logout e redireciona, ao contrário de /login', async () => {
    window.location.pathname = '/login/'
    window.location.href = 'http://localhost:3000/login/'
    axiosMocks.instance.post.mockResolvedValue({ data: { success: false } })

    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/auth/me', method: 'get' },
        response: { status: 401, data: { message: 'expired' } }
      })
    ).rejects.toBeTruthy()

    expect(authStore.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/login')
  })

  it('timeout/rede sem response não dispara refresh nem logout', async () => {
    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/portfolio/summary', method: 'get' },
        message: 'timeout of 30000ms exceeded'
      })
    ).rejects.toMatchObject({ message: 'timeout of 30000ms exceeded' })

    expect(authStore.logout).not.toHaveBeenCalled()
    expect(axiosMocks.instance.post).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/dashboard')
  })
})
