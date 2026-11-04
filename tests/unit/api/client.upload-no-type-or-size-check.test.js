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
const portfolioApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/portfolio.js'),
  'utf8'
)

describe('HTTP client — uploadFile aceita qualquer tipo e tamanho', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosMocks.instance.post.mockResolvedValue({ data: { success: true } })
  })

  it('uploadFile não valida file.type, file.size nem extensão antes do POST', () => {
    const uploadFn = clientSource.slice(
      clientSource.indexOf('export const uploadFile'),
      clientSource.indexOf('export default client')
    )

    expect(uploadFn).toMatch(/formData\.append\('file',\s*file\)/)
    expect(uploadFn).not.toMatch(/file\.type|file\.size|file\.name/)
    expect(uploadFn).not.toMatch(/maxSize|MAX_|accept|mime|csv|xlsx|pdf/)
    expect(uploadFn).not.toMatch(/throw new Error|reject/)
  })

  it('POST /portfolio/import de .exe segue — sem recusa de tipo ou tamanho', async () => {
    expect(portfolioApiSource).not.toMatch(/uploadFile|\/portfolio\/import/)

    const file = new File(['MZ-fake-pe'], 'payload.exe', { type: 'application/x-msdownload' })

    expect(file.type).toBe('application/x-msdownload')
    expect(file.name).toMatch(/\.exe$/)

    await uploadFile('/portfolio/import', file)

    expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1)
    const [url, body] = axiosMocks.instance.post.mock.calls[0]
    expect(url).toBe('/portfolio/import')
    expect(body).toBeInstanceOf(FormData)
    const sent = body.get('file')
    expect(sent).toBeTruthy()
    expect(sent.name).toBe('payload.exe')
    expect(sent.type).toBe('application/x-msdownload')
  })
})
