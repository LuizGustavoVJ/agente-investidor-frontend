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

import '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const storeSource = readFileSync(resolve(__dirname, '../../../src/stores/auth.js'), 'utf8')

describe('Auth — refresh 200 com accessToken não atualiza o JWT da sessão', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.getItem.mockReturnValue(
      JSON.stringify({
        id: 9,
        email: 'ana@exemplo.com',
        token: 'jwt-antigo',
        refreshToken: 'rt-antigo'
      })
    )
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('login grava user.token; o interceptor de refresh não persiste accessToken nem seta Bearer', () => {
    expect(storeSource).toMatch(/user\.value = response\.data\.user/)
    expect(storeSource).toMatch(
      /sessionStorage\.setItem\('user', JSON\.stringify\(user\.value\)\)/
    )

    const responseInterceptor = clientSource.slice(
      clientSource.indexOf('client.interceptors.response.use'),
      clientSource.indexOf('// Função para configurar base URL')
    )

    expect(responseInterceptor).toMatch(/refreshResponse\.data\.success/)
    expect(responseInterceptor).toMatch(/return client\(originalRequest\)/)
    expect(responseInterceptor).not.toMatch(/sessionStorage\.setItem/)
    expect(responseInterceptor).not.toMatch(/setAuthHeader/)
    expect(responseInterceptor).not.toMatch(/accessToken/)
    expect(responseInterceptor).not.toMatch(/Authorization/)
  })

  it('401 + refresh 200 { success, accessToken } retenta sem gravar o JWT novo', async () => {
    const originalRequest = {
      url: '/portfolio/summary',
      method: 'get',
      headers: {}
    }

    axiosMocks.instance.post.mockResolvedValue({
      data: {
        success: true,
        accessToken: 'jwt-novo',
        refreshToken: 'rt-novo'
      }
    })
    axiosMocks.instance.mockResolvedValue({
      data: { success: true, data: { totalValue: 1000 } }
    })

    await axiosMocks.handlers.responseRejected({
      config: originalRequest,
      response: { status: 401, data: { message: 'expired' } }
    })

    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(axiosMocks.instance).toHaveBeenCalledWith(originalRequest)
    expect(originalRequest.headers.Authorization).toBeUndefined()
    expect(originalRequest.headers.authorization).toBeUndefined()
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
    expect(authStore.logout).not.toHaveBeenCalled()
    expect(sessionStorage.getItem).not.toHaveBeenCalled()
  })
})
