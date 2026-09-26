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

describe('HTTP client — refresh success string e pathname com barra', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('refresh com success: "false" reexecuta a request como se o token tivesse renovado', async () => {
    const originalRequest = { url: '/portfolio/summary', _retry: false }
    axiosMocks.instance.post.mockResolvedValue({ data: { success: 'false' } })
    axiosMocks.instance.mockResolvedValue({ data: { ok: true } })

    await axiosMocks.handlers.responseRejected({
      config: originalRequest,
      response: { status: 401, data: { message: 'expired' } }
    })

    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(axiosMocks.instance).toHaveBeenCalledWith(originalRequest)
    expect(authStore.logout).not.toHaveBeenCalled()
  })

  it('refresh que lança em /login/ redireciona porque a barra final não está na allowlist', async () => {
    window.location.pathname = '/login/'
    window.location.href = 'http://localhost:3000/login/'
    const originalRequest = { url: '/auth/me', _retry: false }
    axiosMocks.instance.post.mockRejectedValue(new Error('refresh failed'))

    await expect(
      axiosMocks.handlers.responseRejected({
        config: originalRequest,
        response: { status: 401, data: { message: 'expired' } }
      })
    ).rejects.toBeTruthy()

    expect(authStore.logout).toHaveBeenCalled()
    expect(window.location.href).toBe('/login')
  })
})
