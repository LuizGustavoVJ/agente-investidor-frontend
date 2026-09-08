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

import client, { setAuthHeader, uploadFile } from '@/api/client'

describe('HTTP client — 403/500, rotas públicas e upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.defaults.headers.common = {}
    window.location.pathname = '/'
    window.location.href = 'http://localhost:3000/'
  })

  it('rejeita 403 sem disparar logout nem refresh', async () => {
    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/brokers/connected', method: 'get' },
        response: { status: 403, data: { message: 'Acesso negado' } }
      })
    ).rejects.toMatchObject({ response: { status: 403 } })

    expect(authStore.logout).not.toHaveBeenCalled()
    expect(axiosMocks.instance.post).not.toHaveBeenCalled()
  })

  it('rejeita 500 sem disparar logout nem refresh', async () => {
    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/portfolio/summary', method: 'get' },
        response: { status: 502, data: { message: 'Bad gateway' } }
      })
    ).rejects.toMatchObject({ response: { status: 502 } })

    expect(authStore.logout).not.toHaveBeenCalled()
    expect(axiosMocks.instance.post).not.toHaveBeenCalled()
  })

  it('não redireciona para login após 401 em /cadastro', async () => {
    window.location.pathname = '/cadastro'
    window.location.href = 'http://localhost:3000/cadastro'
    axiosMocks.instance.post.mockResolvedValue({ data: { success: false } })

    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/auth/me', method: 'get' },
        response: { status: 401 }
      })
    ).rejects.toBeTruthy()

    expect(authStore.logout).toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/cadastro')
  })

  it('uploadFile sem onProgress não lança quando o progresso dispara', async () => {
    axiosMocks.instance.post.mockImplementation(async (_url, _data, config) => {
      config.onUploadProgress({ loaded: 40, total: 80 })
      return { data: { success: true } }
    })
    const file = new File(['dados'], 'posicoes.csv', { type: 'text/csv' })

    await expect(uploadFile('/portfolio/import', file)).resolves.toEqual({
      data: { success: true }
    })
  })

  it('setAuthHeader com string vazia remove o Bearer', () => {
    setAuthHeader('token-temporario')
    expect(client.defaults.headers.common.Authorization).toBe('Bearer token-temporario')

    setAuthHeader('')
    expect(client.defaults.headers.common.Authorization).toBeUndefined()
  })
})
