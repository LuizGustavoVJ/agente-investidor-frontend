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
  logout: vi.fn(),
  refreshToken: undefined
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore
}))

import '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const authApiSource = readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8')

describe('HTTP client — refresh 200 sem success encerra a sessão', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('interceptor chama POST /auth/refresh cru, não authAPI.refreshToken', () => {
    expect(authApiSource).toMatch(/refreshToken:\s*\(\)\s*=>\s*\{/)
    expect(authApiSource).toMatch(/client\.post\('\/auth\/refresh'\)/)
    expect(clientSource).toMatch(/client\.post\('\/auth\/refresh'\)/)
    expect(clientSource).not.toMatch(/authAPI\.refreshToken/)
    expect(clientSource).not.toMatch(/from '\.\/auth'/)
  })

  it('401 + refresh 200 { accessToken } sem success faz logout e não retenta o original', async () => {
    axiosMocks.instance.post.mockResolvedValue({
      data: {
        accessToken: 'jwt-renovado',
        user: { id: 9, email: 'ana@exemplo.com' }
      }
    })

    await axiosMocks.handlers.responseRejected({
      config: { url: '/portfolio/summary', method: 'get' },
      response: { status: 401, data: { message: 'token expirado' } }
    }).catch(() => {})

    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(axiosMocks.instance).not.toHaveBeenCalled()
    expect(authStore.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/login')
  })

  it('401 + refresh 200 { success: true } retenta o original e não faz logout', async () => {
    axiosMocks.instance.post.mockResolvedValue({
      data: { success: true }
    })
    axiosMocks.instance.mockResolvedValue({
      data: { success: true, data: { totalValue: 125000 } }
    })

    const original = { url: '/portfolio/summary', method: 'get' }
    await axiosMocks.handlers.responseRejected({
      config: original,
      response: { status: 401, data: { message: 'token expirado' } }
    })

    expect(axiosMocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(axiosMocks.instance).toHaveBeenCalledWith(original)
    expect(authStore.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('http://localhost:3000/dashboard')
  })
})
