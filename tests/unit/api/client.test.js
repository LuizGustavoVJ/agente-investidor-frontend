import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import client, { setBaseURL, setAuthHeader, uploadFile } from '@/api/client'
import { authAPI } from '@/api/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    logout: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}))

describe('HTTP client', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    delete client.defaults.headers.common.Authorization
  })

  it('envia cookies HTTP-only em todas as requisições', () => {
    expect(client.defaults.withCredentials).toBe(true)
    expect(client.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('setAuthHeader adiciona e remove Bearer token', () => {
    setAuthHeader('abc123')
    expect(client.defaults.headers.common.Authorization).toBe('Bearer abc123')

    setAuthHeader(null)
    expect(client.defaults.headers.common.Authorization).toBeUndefined()
  })

  it('setBaseURL atualiza o endpoint da API', () => {
    const previous = client.defaults.baseURL
    setBaseURL('https://api.example.test')
    expect(client.defaults.baseURL).toBe('https://api.example.test')
    setBaseURL(previous)
  })

  it('interceptor de request adiciona X-Requested-With', async () => {
    const handler = client.interceptors.request.handlers[0].fulfilled
    const config = { headers: {}, method: 'get', url: '/portfolio' }

    const result = await handler(config)

    expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest')
  })

  it('em 401 tenta refresh e reexecuta a requisição original', async () => {
    const rejected = client.interceptors.response.handlers[0].rejected
    const originalRequest = {
      method: 'get',
      url: '/portfolio/summary',
      headers: {}
    }
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({
      data: { success: true }
    })
    const originalAdapter = client.defaults.adapter
    client.defaults.adapter = vi.fn().mockResolvedValue({
      data: { recovered: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: originalRequest
    })

    const result = await rejected({
      config: originalRequest,
      response: { status: 401, data: { message: 'expired' } },
      message: 'expired'
    })

    expect(originalRequest._retry).toBe(true)
    expect(postSpy).toHaveBeenCalledWith('/auth/refresh')
    expect(result.data).toEqual({ recovered: true })

    postSpy.mockRestore()
    client.defaults.adapter = originalAdapter
  })

  it('em 401 com refresh falho faz logout e rejeita o erro', async () => {
    const rejected = client.interceptors.response.handlers[0].rejected
    const postSpy = vi.spyOn(client, 'post').mockRejectedValue(new Error('refresh failed'))

    await expect(rejected({
      config: { method: 'get', url: '/portfolio/summary' },
      response: { status: 401, data: { message: 'expired' } },
      message: 'expired'
    })).rejects.toMatchObject({
      response: { status: 401 }
    })

    expect(authAPI.logout).toHaveBeenCalled()
    postSpy.mockRestore()
  })

  it('não tenta refresh duas vezes na mesma requisição', async () => {
    const rejected = client.interceptors.response.handlers[0].rejected
    const postSpy = vi.spyOn(client, 'post')

    await expect(rejected({
      config: { method: 'get', url: '/me', _retry: true },
      response: { status: 401, data: { message: 'expired' } },
      message: 'expired'
    })).rejects.toMatchObject({ response: { status: 401 } })

    expect(postSpy).not.toHaveBeenCalled()
    expect(authAPI.logout).not.toHaveBeenCalled()
    postSpy.mockRestore()
  })

  it('uploadFile envia multipart e reporta progresso', async () => {
    const postSpy = vi.spyOn(client, 'post').mockImplementation(async (url, body, config) => {
      config.onUploadProgress({ loaded: 50, total: 100 })
      return { data: { success: true } }
    })
    const onProgress = vi.fn()
    const file = new File(['conteudo'], 'extrato.csv', { type: 'text/csv' })

    const result = await uploadFile('/portfolio/import', file, onProgress)

    expect(result.data.success).toBe(true)
    expect(onProgress).toHaveBeenCalledWith(50)
    expect(postSpy.mock.calls[0][2].headers['Content-Type']).toBe('multipart/form-data')
    expect(postSpy.mock.calls[0][1]).toBeInstanceOf(FormData)
    postSpy.mockRestore()
  })
})
