import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
    headers: { common: {}, 'Content-Type': 'application/json' }
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

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ logout: vi.fn() })
}))

import { uploadFile } from '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')

describe('HTTP client — upload multipart sem boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosMocks.instance.post.mockResolvedValue({ data: { success: true } })
  })

  it('força Content-Type multipart/form-data e não deixa o axios gerar boundary', () => {
    const uploadFn = clientSource.slice(
      clientSource.indexOf('export const uploadFile'),
      clientSource.indexOf('export default client')
    )

    expect(uploadFn).toMatch(/['"]Content-Type['"]:\s*['"]multipart\/form-data['"]/)
    expect(uploadFn).not.toMatch(/boundary/)
    expect(uploadFn).toMatch(/formData\.append\('file'/)
  })

  it('POST de arquivo manda header multipart sem boundary e sem Authorization', async () => {
    const file = new File(['conteudo-csv'], 'extrato.csv', { type: 'text/csv' })

    await uploadFile('/portfolio/import', file)

    expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1)
    const [url, body, config] = axiosMocks.instance.post.mock.calls[0]

    expect(url).toBe('/portfolio/import')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file')).toBeTruthy()
    expect(config.headers['Content-Type']).toBe('multipart/form-data')
    expect(config.headers['Content-Type']).not.toMatch(/boundary=/)
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('instância Axios já nasce com Content-Type application/json no default', () => {
    expect(clientSource).toMatch(/['"]Content-Type['"]:\s*['"]application\/json['"]/)
    expect(axiosMocks.instance.defaults.headers['Content-Type']).toBe('application/json')
  })
})
