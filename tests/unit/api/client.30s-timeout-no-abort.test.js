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
const portfolioApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/portfolio.js'),
  'utf8'
)
const brokersApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/brokers.js'),
  'utf8'
)
const createCfg = axios.create.mock.calls[0][0]

describe('HTTP client — timeout global de 30s sem AbortController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('axios.create usa timeout 30000 e o client não cria AbortController/signal', () => {
    expect(createCfg.timeout).toBe(30000)
    expect(clientSource).toMatch(/timeout:\s*30000/)
    expect(clientSource).not.toMatch(/AbortController|\bsignal\b/)
    expect(createCfg.signal).toBeUndefined()
  })

  it('login, /auth/me, refresh e sync de corretora herdam 30s — sem override por request', () => {
    const loginFn = authApiSource.slice(
      authApiSource.indexOf('login:'),
      authApiSource.indexOf('register:')
    )
    expect(loginFn).toMatch(/client\.post\('\/auth\/login'/)
    expect(loginFn).not.toMatch(/timeout|signal|AbortController/)

    const checkFn = authApiSource.slice(
      authApiSource.indexOf('checkAuth:'),
      authApiSource.indexOf('refreshToken:')
    )
    expect(checkFn).toMatch(/client\.get\('\/auth\/me'\)/)
    expect(checkFn).not.toMatch(/timeout|signal|AbortController/)

    const refreshFn = authApiSource.slice(
      authApiSource.indexOf('refreshToken:'),
      authApiSource.indexOf('updateProfile:')
    )
    expect(refreshFn).toMatch(/client\.post\('\/auth\/refresh'\)/)
    expect(refreshFn).not.toMatch(/timeout|signal|AbortController/)

    const syncFn = portfolioApiSource.slice(
      portfolioApiSource.indexOf('syncBrokers:'),
      portfolioApiSource.indexOf('getSyncStatus:')
    )
    expect(syncFn).toMatch(/client\.post\('\/portfolio\/sync'\)/)
    expect(syncFn).not.toMatch(/timeout|signal|AbortController/)

    const syncAllFn = brokersApiSource.slice(
      brokersApiSource.indexOf('syncAllBrokers:'),
      brokersApiSource.indexOf('getSyncStatus:')
    )
    expect(syncAllFn).toMatch(/client\.post\('\/brokers\/sync\/all'\)/)
    expect(syncAllFn).not.toMatch(/timeout|signal|AbortController/)

    const config = {
      method: 'post',
      url: '/portfolio/sync',
      headers: {}
    }
    const result = axiosMocks.handlers.requestFulfilled(config)
    expect(result.timeout).toBeUndefined()
    expect(result.signal).toBeUndefined()
  })
})
