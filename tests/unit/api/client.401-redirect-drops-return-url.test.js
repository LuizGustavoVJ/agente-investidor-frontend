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
const middlewareSource = readFileSync(resolve(__dirname, '../../../src/middleware/auth.js'), 'utf8')

describe('HTTP client — 401 redireciona para /login sem URL de retorno', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStore.logout.mockReset()
    axiosMocks.instance.post.mockReset()
    axiosMocks.instance.mockReset()
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  it('href de 401 é literal /login — não interpola pathname nem query redirect', () => {
    expect(clientSource).toMatch(/window\.location\.href = '\/login'/)
    expect(clientSource).toMatch(/const publicRoutes = \['\/', '\/login', '\/cadastro'\]/)
    expect(clientSource).not.toMatch(/href = `\/login\?redirect=/)
    expect(clientSource).not.toMatch(/searchParams|URLSearchParams/)
    expect(middlewareSource).toMatch(/query:\s*\{\s*redirect:\s*to\.fullPath/)
  })

  it('401 em /dashboard após refresh falho manda para /login sem ?redirect=', async () => {
    axiosMocks.instance.post.mockRejectedValue(new Error('refresh falhou'))

    await axiosMocks.handlers.responseRejected({
      config: { url: '/portfolio/summary', method: 'get' },
      response: { status: 401, data: { message: 'token expirado' } }
    }).catch(() => {})

    expect(authStore.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/login')
    expect(window.location.href).not.toContain('redirect')
    expect(window.location.href).not.toContain('dashboard')
  })

  it('401 em /configuracoes também descarta a rota autenticada', async () => {
    window.location.pathname = '/configuracoes'
    window.location.href = 'http://localhost:3000/configuracoes'
    axiosMocks.instance.post.mockResolvedValue({ data: { message: 'cookie morto' } })

    await axiosMocks.handlers.responseRejected({
      config: { url: '/auth/me', method: 'get' },
      response: { status: 401, data: { message: 'não autorizado' } }
    }).catch(() => {})

    expect(authStore.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/login')
    expect(window.location.href).not.toContain('configuracoes')
    expect(window.location.href).not.toMatch(/redirect=/)
  })
})
