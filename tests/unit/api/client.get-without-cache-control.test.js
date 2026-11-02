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

import '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const authApiSource = readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8')
const portfolioApiSource = readFileSync(resolve(__dirname, '../../../src/api/portfolio.js'), 'utf8')
const createCfg = axios.create.mock.calls[0][0]

describe('HTTP client — GET autenticado sem Cache-Control nem cache-buster', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('axios.create e o interceptor não mandam Cache-Control/Pragma/Expires', () => {
    expect(createCfg.headers['Cache-Control']).toBeUndefined()
    expect(createCfg.headers.Pragma).toBeUndefined()
    expect(createCfg.headers.Expires).toBeUndefined()
    expect(createCfg.headers['If-None-Match']).toBeUndefined()
    expect(createCfg.headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    })

    expect(clientSource).not.toMatch(/Cache-Control|Pragma|no-store|no-cache|Expires/)
    expect(clientSource).not.toMatch(/_t=|cacheBust|cache-bust/)
  })

  it('GET /auth/me sai sem no-store e sem timestamp — cache HTTP pode restaurar sessão', () => {
    const checkFn = authApiSource.slice(
      authApiSource.indexOf('checkAuth:'),
      authApiSource.indexOf('refreshToken:')
    )
    expect(checkFn).toMatch(/client\.get\('\/auth\/me'\)/)
    expect(checkFn).not.toMatch(/params|headers|Cache-Control|_t/)

    const config = {
      method: 'get',
      url: '/auth/me',
      headers: {}
    }
    const result = axiosMocks.handlers.requestFulfilled(config)

    expect(result.headers['X-Requested-With']).toBe('XMLHttpRequest')
    expect(result.headers['Cache-Control']).toBeUndefined()
    expect(result.headers.Pragma).toBeUndefined()
    expect(result.params).toBeUndefined()
    expect(result.url).toBe('/auth/me')
  })

  it('GET /portfolio/summary também vai cacheável — patrimônio pode ficar stale após sync', () => {
    const summaryFn = portfolioApiSource.slice(
      portfolioApiSource.indexOf('getSummary:'),
      portfolioApiSource.indexOf('getAllocation:')
    )
    expect(summaryFn).toMatch(/client\.get\('\/portfolio\/summary'\)/)
    expect(summaryFn).not.toMatch(/params|headers|Cache-Control|_t/)

    const config = {
      method: 'get',
      url: '/portfolio/summary',
      headers: {}
    }
    const result = axiosMocks.handlers.requestFulfilled(config)

    expect(result.headers['Cache-Control']).toBeUndefined()
    expect(result.headers.Pragma).toBeUndefined()
    expect(result.params).toBeUndefined()
  })
})
