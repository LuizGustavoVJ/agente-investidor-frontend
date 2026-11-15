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

const percentFromProgress = (progressEvent) =>
  Math.round((progressEvent.loaded * 100) / progressEvent.total)

describe('HTTP client — uploadFile divide por progressEvent.total sem guarda', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('onUploadProgress faz loaded*100/total sem checar total === 0', () => {
    const uploadFn = clientSource.slice(
      clientSource.indexOf('export const uploadFile'),
      clientSource.indexOf('export default client')
    )

    expect(uploadFn).toMatch(/onUploadProgress:\s*\(progressEvent\)\s*=>/)
    expect(uploadFn).toMatch(/\(progressEvent\.loaded \* 100\) \/ progressEvent\.total/)
    expect(uploadFn).not.toMatch(/progressEvent\.total\s*[!=]==?\s*0/)
    expect(uploadFn).not.toMatch(/Number\.isFinite|progressEvent\.lengthComputable/)
  })

  it('total 0 vira Infinity no callback; total ausente vira NaN', async () => {
    const percents = []

    axiosMocks.instance.post.mockImplementation(async (url, body, config) => {
      config.onUploadProgress({ loaded: 10, total: 0 })
      config.onUploadProgress({ loaded: 10 })
      return { data: { success: true } }
    })

    const file = new File(['csv'], 'extrato.csv', { type: 'text/csv' })
    await uploadFile('/portfolio/import', file, (percent) => percents.push(percent))

    expect(percents).toEqual([Infinity, NaN])
    expect(percentFromProgress({ loaded: 10, total: 0 })).toBe(Infinity)
    expect(percentFromProgress({ loaded: 10, total: undefined })).toBeNaN()
    expect(axiosMocks.instance.post).toHaveBeenCalledTimes(1)
  })
})
