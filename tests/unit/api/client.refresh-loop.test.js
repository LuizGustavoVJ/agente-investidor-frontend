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

import { uploadFile } from '@/api/client'

describe('HTTP client — 401 no refresh e upload sem total', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.mockReset()
    axiosMocks.instance.post.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('401 em /auth/refresh dispara outro refresh (sem guarda de URL)', async () => {
    let refreshCalls = 0

    axiosMocks.instance.post.mockImplementation(async (url) => {
      if (url === '/auth/refresh') {
        refreshCalls += 1
        if (refreshCalls > 3) {
          throw new Error('refresh-loop')
        }
        return axiosMocks.handlers.responseRejected({
          config: { url: '/auth/refresh', method: 'post' },
          response: { status: 401, data: { message: 'refresh expired' } }
        })
      }
    })

    await expect(
      axiosMocks.handlers.responseRejected({
        config: { url: '/portfolio/summary', method: 'get' },
        response: { status: 401, data: { message: 'expired' } }
      })
    ).rejects.toBeTruthy()

    expect(refreshCalls).toBeGreaterThan(1)
    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
  })

  it('uploadFile com total 0 reporta Infinity de progresso', async () => {
    const onProgress = vi.fn()
    axiosMocks.instance.post.mockImplementation(async (_url, _data, config) => {
      config.onUploadProgress({ loaded: 10, total: 0 })
      return { data: { success: true } }
    })

    const file = new File(['x'], 'extrato.csv', { type: 'text/csv' })
    await uploadFile('/portfolio/import', file, onProgress)

    expect(onProgress).toHaveBeenCalledWith(Infinity)
  })
})
