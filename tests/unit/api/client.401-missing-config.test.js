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

describe('HTTP client — 401 sem error.config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('401 sem config lança ao ler _retry e não faz logout nem refresh', async () => {
    await expect(
      axiosMocks.handlers.responseRejected({
        response: { status: 401, data: { message: 'expired' } }
      })
    ).rejects.toBeInstanceOf(TypeError)

    expect(authStore.logout).not.toHaveBeenCalled()
    expect(axiosMocks.instance.post).not.toHaveBeenCalled()
  })

  it('401 com config null também quebra antes de renovar o token', async () => {
    await expect(
      axiosMocks.handlers.responseRejected({
        config: null,
        response: { status: 401, data: { message: 'expired' } }
      })
    ).rejects.toBeInstanceOf(TypeError)

    expect(authStore.logout).not.toHaveBeenCalled()
    expect(axiosMocks.instance.post).not.toHaveBeenCalled()
  })
})
