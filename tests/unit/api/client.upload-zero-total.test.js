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

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ logout: vi.fn() })
}))

import { uploadFile } from '@/api/client'

describe('HTTP client — uploadFile com total 0', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosMocks.instance.post.mockReset()
  })

  it('progressEvent.total 0 entrega Infinity para onProgress', async () => {
    const onProgress = vi.fn()
    axiosMocks.instance.post.mockImplementation((_url, _data, config) => {
      config.onUploadProgress({ loaded: 10, total: 0 })
      return Promise.resolve({ data: { success: true } })
    })

    const file = { name: 'extrato.csv', size: 10 }
    await uploadFile('/portfolio/import', file, onProgress)

    expect(onProgress).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith(Infinity)
    expect(Number.isFinite(onProgress.mock.calls[0][0])).toBe(false)
  })
})
