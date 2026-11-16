import { describe, it, expect, beforeEach, vi } from 'vitest'

const { logout, handlers, instance } = vi.hoisted(() => {
  const handlers = {
    request: [],
    response: []
  }
  const logout = vi.fn()
  const instance = Object.assign(
    vi.fn(async (config) => ({ data: { retried: true }, config })),
    {
      interceptors: {
        request: {
          use: (fulfilled, rejected) => {
            handlers.request.push({ fulfilled, rejected })
          }
        },
        response: {
          use: (fulfilled, rejected) => {
            handlers.response.push({ fulfilled, rejected })
          }
        }
      },
      defaults: {
        baseURL: '/api',
        timeout: 30000,
        headers: { common: {} }
      },
      post: vi.fn(),
      get: vi.fn()
    }
  )
  return { logout, handlers, instance }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ logout })
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => instance)
  }
}))

import client, { setAuthHeader, setBaseURL, uploadFile } from '@/api/client'

const requestFulfilled = () => handlers.request[0].fulfilled
const requestRejected = () => handlers.request[0].rejected
const responseRejected = () => handlers.response[0].rejected
const responseFulfilled = () => handlers.response[0].fulfilled

describe('Cliente HTTP — interceptors e helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    instance.defaults.headers.common = {}
    instance.defaults.baseURL = '/api'
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
    logout.mockResolvedValue(undefined)
  })

  it('marca toda requisição como XMLHttpRequest', async () => {
    const config = { method: 'get', url: '/portfolio/summary', headers: {} }

    const result = await requestFulfilled()(config)

    expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest')
  })

  it('rejeita erro de request interceptor sem engolir a causa', async () => {
    const error = new Error('offline')

    await expect(requestRejected()(error)).rejects.toBe(error)
  })

  it('em 401 tenta refresh uma vez e reexecuta a requisição original', async () => {
    instance.post.mockResolvedValue({ data: { success: true } })
    const originalRequest = { url: '/portfolio/summary', _retry: false }

    const result = await responseRejected()({
      config: originalRequest,
      response: { status: 401, data: { message: 'expired' } }
    })

    expect(originalRequest._retry).toBe(true)
    expect(instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(instance).toHaveBeenCalledWith(originalRequest)
    expect(result.data.retried).toBe(true)
    expect(logout).not.toHaveBeenCalled()
  })

  it('faz logout quando o refresh responde sem success e redireciona fora de rotas públicas', async () => {
    instance.post.mockResolvedValue({ data: { success: false } })
    const originalRequest = { url: '/portfolio/summary' }

    await expect(
      responseRejected()({
        config: originalRequest,
        response: { status: 401 }
      })
    ).rejects.toMatchObject({ response: { status: 401 } })

    expect(logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/login')
  })

  it('não redireciona para login se o 401 ocorrer em /cadastro', async () => {
    window.location.pathname = '/cadastro'
    instance.post.mockRejectedValue(new Error('refresh fail'))

    await expect(
      responseRejected()({
        config: { url: '/auth/register' },
        response: { status: 401 }
      })
    ).rejects.toBeTruthy()

    expect(logout).toHaveBeenCalled()
    expect(window.location.href).not.toBe('/login')
  })

  it('não tenta refresh nem logout no segundo 401 da mesma request', async () => {
    await expect(
      responseRejected()({
        config: { url: '/auth/refresh', _retry: true },
        response: { status: 401 }
      })
    ).rejects.toMatchObject({ response: { status: 401 } })

    expect(instance.post).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })

  it('em 403 não dispara logout', async () => {
    await expect(
      responseRejected()({
        config: { method: 'get', url: '/admin' },
        response: { status: 403, data: { message: 'sem permissão' } }
      })
    ).rejects.toBeTruthy()

    expect(logout).not.toHaveBeenCalled()
  })

  it('em 500 não dispara logout', async () => {
    await expect(
      responseRejected()({
        config: { method: 'get', url: '/portfolio/summary' },
        response: { status: 500, data: { message: 'boom' } }
      })
    ).rejects.toBeTruthy()

    expect(logout).not.toHaveBeenCalled()
  })

  it('devolve a resposta de sucesso intacta', async () => {
    const response = { status: 200, data: { ok: true }, config: { method: 'get', url: '/x' } }

    expect(responseFulfilled()(response)).toBe(response)
  })

  it('setAuthHeader grava Bearer e remove o header quando o token é vazio', () => {
    setAuthHeader('abc.def')
    expect(instance.defaults.headers.common.Authorization).toBe('Bearer abc.def')

    setAuthHeader(null)
    expect(instance.defaults.headers.common.Authorization).toBeUndefined()
  })

  it('setBaseURL altera o default do axios criado', () => {
    setBaseURL('https://api.exemplo.com')
    expect(client.defaults.baseURL).toBe('https://api.exemplo.com')
  })

  it('uploadFile envia multipart e reporta progresso; total 0 vira Infinity', async () => {
    instance.post.mockImplementation((url, data, config) => {
      config.onUploadProgress({ loaded: 10, total: 0 })
      return Promise.resolve({ data: { stored: true } })
    })
    const onProgress = vi.fn()
    const file = new File(['conteudo'], 'extrato.csv', { type: 'text/csv' })

    const result = await uploadFile('/portfolio/import', file, onProgress)

    expect(instance.post).toHaveBeenCalledTimes(1)
    const [, formData, options] = instance.post.mock.calls[0]
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('file')).toBe(file)
    expect(options.headers['Content-Type']).toBe('multipart/form-data')
    expect(onProgress).toHaveBeenCalledWith(Infinity)
    expect(result.data.stored).toBe(true)
  })
})
