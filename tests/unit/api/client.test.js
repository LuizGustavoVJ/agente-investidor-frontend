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

import client, { setBaseURL, setAuthHeader, uploadFile } from '@/api/client'

describe('HTTP client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.defaults.headers.common = {}
    axiosMocks.instance.defaults.baseURL = '/api'
    window.location.pathname = '/'
    window.location.href = 'http://localhost:3000/'
  })

  describe('interceptor de requisição', () => {
    it('adiciona header X-Requested-With em toda request', () => {
      const config = { method: 'get', url: '/portfolio/summary', headers: {} }

      const result = axiosMocks.handlers.requestFulfilled(config)

      expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest')
    })

    it('rejeita erros de preparação da request', async () => {
      const error = new Error('canceled')

      await expect(axiosMocks.handlers.requestRejected(error)).rejects.toBe(error)
    })
  })

  describe('interceptor de resposta — 401 e refresh', () => {
    it('renova o token uma vez e reexecuta a request original', async () => {
      const originalRequest = { url: '/portfolio/summary', method: 'get' }
      axiosMocks.instance.post.mockResolvedValue({ data: { success: true } })
      axiosMocks.instance.mockResolvedValue({ data: { ok: true } })

      const result = await axiosMocks.handlers.responseRejected({
        config: originalRequest,
        response: { status: 401, data: { message: 'expired' } }
      })

      expect(originalRequest._retry).toBe(true)
      expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
      expect(axiosMocks.instance).toHaveBeenCalledWith(originalRequest)
      expect(result).toEqual({ data: { ok: true } })
      expect(authStore.logout).not.toHaveBeenCalled()
    })

    it('não tenta refresh de novo na mesma request (evita loop)', async () => {
      const originalRequest = { url: '/portfolio/summary', method: 'get', _retry: true }

      await expect(
        axiosMocks.handlers.responseRejected({
          config: originalRequest,
          response: { status: 401, data: { message: 'expired' } }
        })
      ).rejects.toMatchObject({ response: { status: 401 } })

      expect(axiosMocks.instance.post).not.toHaveBeenCalled()
    })

    it('faz logout quando o refresh falha', async () => {
      window.location.pathname = '/dashboard'
      axiosMocks.instance.post.mockRejectedValue(new Error('refresh failed'))

      await expect(
        axiosMocks.handlers.responseRejected({
          config: { url: '/portfolio/summary', method: 'get' },
          response: { status: 401, data: { message: 'expired' } }
        })
      ).rejects.toBeTruthy()

      expect(authStore.logout).toHaveBeenCalledTimes(1)
      expect(window.location.href).toBe('/login')
    })

    it('não redireciona para login em rotas públicas após 401', async () => {
      window.location.pathname = '/login'
      window.location.href = 'http://localhost:3000/login'
      axiosMocks.instance.post.mockResolvedValue({ data: { success: false } })

      await expect(
        axiosMocks.handlers.responseRejected({
          config: { url: '/auth/me', method: 'get' },
          response: { status: 401 }
        })
      ).rejects.toBeTruthy()

      expect(authStore.logout).toHaveBeenCalled()
      expect(window.location.href).toBe('http://localhost:3000/login')
    })

    it('rejeita erros de rede sem disparar logout', async () => {
      await expect(
        axiosMocks.handlers.responseRejected({
          config: { url: '/portfolio/summary', method: 'get' },
          message: 'Network Error'
        })
      ).rejects.toMatchObject({ message: 'Network Error' })

      expect(authStore.logout).not.toHaveBeenCalled()
      expect(axiosMocks.instance.post).not.toHaveBeenCalled()
    })
  })

  describe('helpers', () => {
    it('setBaseURL atualiza o client compartilhado', () => {
      setBaseURL('https://api.exemplo.com')
      expect(client.defaults.baseURL).toBe('https://api.exemplo.com')
    })

    it('setAuthHeader define e remove Bearer token', () => {
      setAuthHeader('abc123')
      expect(client.defaults.headers.common.Authorization).toBe('Bearer abc123')

      setAuthHeader(null)
      expect(client.defaults.headers.common.Authorization).toBeUndefined()
    })

    it('uploadFile envia multipart e reporta progresso percentual', async () => {
      axiosMocks.instance.post.mockImplementation(async (url, data, config) => {
        config.onUploadProgress({ loaded: 25, total: 100 })
        return { data: { success: true } }
      })
      const onProgress = vi.fn()
      const file = new File(['conteudo'], 'extrato.csv', { type: 'text/csv' })

      const result = await uploadFile('/portfolio/import', file, onProgress)

      expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1)
      const [, formData, config] = axiosMocks.instance.post.mock.calls[0]
      expect(formData).toBeInstanceOf(FormData)
      expect(formData.get('file')).toBe(file)
      expect(config.headers['Content-Type']).toBe('multipart/form-data')
      expect(onProgress).toHaveBeenCalledWith(25)
      expect(result.data.success).toBe(true)
    })
  })
})
