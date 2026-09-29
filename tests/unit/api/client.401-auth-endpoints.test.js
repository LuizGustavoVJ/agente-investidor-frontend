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

describe('HTTP client — 401 em login, cadastro e logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/login'
    window.location.href = 'http://localhost:3000/login'
  })

  it('senha errada (401 em POST /auth/login) dispara refresh e logout', async () => {
    axiosMocks.instance.post.mockResolvedValue({ data: { success: false } })

    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/auth/login', method: 'post' },
        response: { status: 401, data: { message: 'Credenciais inválidas' } }
      })
    ).rejects.toBeTruthy()

    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(authStore.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('http://localhost:3000/login')
  })

  it('401 em POST /auth/register também tenta refresh e chama logout', async () => {
    window.location.pathname = '/cadastro'
    window.location.href = 'http://localhost:3000/cadastro'
    axiosMocks.instance.post.mockResolvedValue({ data: { success: false } })

    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/auth/register', method: 'post' },
        response: { status: 401, data: { message: 'Não autorizado' } }
      })
    ).rejects.toBeTruthy()

    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(authStore.logout).toHaveBeenCalledTimes(1)
  })

  it('401 em POST /auth/logout chama logout de novo (reentrância)', async () => {
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
    axiosMocks.instance.post.mockResolvedValue({ data: { success: false } })

    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/auth/logout', method: 'post' },
        response: { status: 401, data: { message: 'sessão já encerrada' } }
      })
    ).rejects.toBeTruthy()

    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(authStore.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/login')
  })
})
