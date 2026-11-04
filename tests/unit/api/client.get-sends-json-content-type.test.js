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

import '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const authApiSource = readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8')
const portfolioApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/portfolio.js'),
  'utf8'
)
const createCfg = axios.create.mock.calls[0][0]

describe('HTTP client — GET autenticado sai com Content-Type application/json', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('axios.create aplica Content-Type JSON em todas as requests, inclusive GET sem body', () => {
    expect(createCfg.headers['Content-Type']).toBe('application/json')
    expect(clientSource).toMatch(/['"]Content-Type['"]:\s*['"]application\/json['"]/)
    expect(clientSource).not.toMatch(/delete config\.headers\[['"]Content-Type['"]\]/)
    expect(clientSource).not.toMatch(/method === ['"]get['"].*Content-Type|Content-Type.*GET/i)
  })

  it('interceptor de GET /auth/me não remove Content-Type — WAF/proxy pode rejeitar GET com JSON', () => {
    const checkFn = authApiSource.slice(
      authApiSource.indexOf('checkAuth:'),
      authApiSource.indexOf('refreshToken:')
    )
    expect(checkFn).toMatch(/client\.get\('\/auth\/me'\)/)
    expect(checkFn).not.toMatch(/headers|Content-Type/)

    const config = {
      method: 'get',
      url: '/auth/me',
      headers: { 'Content-Type': 'application/json' }
    }
    const result = axiosMocks.handlers.requestFulfilled(config)

    expect(result.headers['Content-Type']).toBe('application/json')
    expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest')
    expect(result.data).toBeUndefined()
    expect(result.url).toBe('/auth/me')
  })

  it('GET /portfolio/summary também herda Content-Type JSON sem body', () => {
    const summaryFn = portfolioApiSource.slice(
      portfolioApiSource.indexOf('getSummary:'),
      portfolioApiSource.indexOf('getAllocation:')
    )
    expect(summaryFn).toMatch(/client\.get\('\/portfolio\/summary'\)/)
    expect(summaryFn).not.toMatch(/headers|Content-Type/)

    const config = {
      method: 'get',
      url: '/portfolio/summary',
      headers: { 'Content-Type': 'application/json' }
    }
    const result = axiosMocks.handlers.requestFulfilled(config)

    expect(result.headers['Content-Type']).toBe('application/json')
    expect(result.data).toBeUndefined()
  })
})
