import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockLogout, mockClient } = vi.hoisted(() => {
  const client = vi.fn()
  client.interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
  client.defaults = {
    baseURL: '/api',
    headers: { common: {} }
  }
  client.post = vi.fn()
  client.get = vi.fn()
  return {
    mockLogout: vi.fn().mockResolvedValue(undefined),
    mockClient: client
  }
})

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockClient)
  }
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    logout: mockLogout
  })
}))

import { setBaseURL, setAuthHeader, uploadFile } from '@/api/client'

const requestSuccess = mockClient.interceptors.request.use.mock.calls[0][0]
const requestError = mockClient.interceptors.request.use.mock.calls[0][1]
const responseSuccess = mockClient.interceptors.response.use.mock.calls[0][0]
const responseError = mockClient.interceptors.response.use.mock.calls[0][1]

describe('HTTP client', () => {
  beforeEach(() => {
    mockClient.mockReset()
    mockClient.post.mockReset()
    mockLogout.mockClear()
    mockClient.defaults.headers.common = {}
    mockClient.defaults.baseURL = '/api'
    window.location.pathname = '/'
    window.location.href = 'http://localhost:3000'
  })

  describe('setBaseURL / setAuthHeader', () => {
    it('atualiza a baseURL usada pelo axios', () => {
      setBaseURL('https://api.example.com')
      expect(mockClient.defaults.baseURL).toBe('https://api.example.com')
    })

    it('define Bearer quando há token e remove quando o token é falsy', () => {
      setAuthHeader('abc123')
      expect(mockClient.defaults.headers.common.Authorization).toBe('Bearer abc123')

      setAuthHeader(null)
      expect(mockClient.defaults.headers.common.Authorization).toBeUndefined()
    })
  })

  describe('interceptor de requisição', () => {
    it('marca X-Requested-With em toda request', () => {
      const config = { headers: {}, method: 'get', url: '/portfolio' }
      const result = requestSuccess(config)

      expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest')
    })

    it('rejeita erro de configuração da request', async () => {
      const err = new Error('config inválida')
      await expect(requestError(err)).rejects.toBe(err)
    })
  })

  describe('interceptor de resposta 401', () => {
    it('renova o cookie e reexecuta a request original uma única vez', async () => {
      const originalRequest = { url: '/portfolio/summary', _retry: false }
      mockClient.post.mockResolvedValue({ data: { success: true } })
      mockClient.mockResolvedValue({ data: { ok: true } })

      const result = await responseError({
        config: originalRequest,
        response: { status: 401, data: { message: 'expired' } }
      })

      expect(originalRequest._retry).toBe(true)
      expect(mockClient.post).toHaveBeenCalledWith('/auth/refresh')
      expect(mockClient).toHaveBeenCalledWith(originalRequest)
      expect(result).toEqual({ data: { ok: true } })
      expect(mockLogout).not.toHaveBeenCalled()
    })

    it('faz logout e redireciona quando o refresh falha fora de rota pública', async () => {
      window.location.pathname = '/dashboard'
      const originalRequest = { url: '/portfolio/summary' }
      mockClient.post.mockRejectedValue(new Error('refresh inválido'))

      await expect(responseError({
        config: originalRequest,
        response: { status: 401, data: { message: 'expired' } }
      })).rejects.toMatchObject({ response: { status: 401 } })

      expect(mockLogout).toHaveBeenCalledTimes(1)
      expect(window.location.href).toBe('/login')
    })

    it('faz logout sem redirecionar em /login, /cadastro ou /', async () => {
      window.location.pathname = '/login'
      window.location.href = 'http://localhost:3000/login'
      mockClient.post.mockResolvedValue({ data: { success: false } })

      await expect(responseError({
        config: { url: '/auth/me' },
        response: { status: 401 }
      })).rejects.toBeTruthy()

      expect(mockLogout).toHaveBeenCalledTimes(1)
      expect(window.location.href).toBe('http://localhost:3000/login')
    })

    it('não tenta refresh de novo na mesma request', async () => {
      await expect(responseError({
        config: { url: '/portfolio', _retry: true },
        response: { status: 401 }
      })).rejects.toBeTruthy()

      expect(mockClient.post).not.toHaveBeenCalled()
      expect(mockLogout).not.toHaveBeenCalled()
    })
  })

  describe('outros status', () => {
    it('repassa 403 e 500 sem logout', async () => {
      await expect(responseError({
        config: { method: 'get', url: '/admin' },
        response: { status: 403, data: { message: 'sem permissão' } }
      })).rejects.toMatchObject({ response: { status: 403 } })

      await expect(responseError({
        config: { method: 'get', url: '/portfolio' },
        response: { status: 500, data: { message: 'boom' } }
      })).rejects.toMatchObject({ response: { status: 500 } })

      expect(mockLogout).not.toHaveBeenCalled()
    })

    it('devolve a resposta de sucesso intacta', () => {
      const response = { status: 200, config: { method: 'get', url: '/me' }, data: { ok: true } }
      expect(responseSuccess(response)).toBe(response)
    })
  })

  describe('uploadFile', () => {
    it('envia multipart e reporta progresso percentual', async () => {
      mockClient.post.mockImplementation((url, data, config) => {
        config.onUploadProgress({ loaded: 50, total: 100 })
        return Promise.resolve({ data: { success: true } })
      })
      const onProgress = vi.fn()
      const file = new File(['conteudo'], 'extrato.csv', { type: 'text/csv' })

      const result = await uploadFile('/brokers/import', file, onProgress)

      expect(mockClient.post).toHaveBeenCalledWith(
        '/brokers/import',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      )
      const sent = mockClient.post.mock.calls[0][1]
      expect(sent.get('file')).toBe(file)
      expect(onProgress).toHaveBeenCalledWith(50)
      expect(result.data.success).toBe(true)
    })

    it('não quebra quando onProgress é omitido', async () => {
      mockClient.post.mockImplementation((url, data, config) => {
        config.onUploadProgress({ loaded: 10, total: 10 })
        return Promise.resolve({ data: { ok: true } })
      })

      await expect(uploadFile('/upload', new File(['x'], 'x.txt'))).resolves.toEqual({ data: { ok: true } })
    })
  })
})
