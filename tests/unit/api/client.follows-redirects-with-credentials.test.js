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

import { setBaseURL } from '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const createCfg = axios.create.mock.calls[0][0]

describe('HTTP client — segue redirect com withCredentials e setBaseURL sem allowlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('axios.create liga withCredentials e não zera maxRedirects — 302 do API é seguido com cookie', () => {
    expect(createCfg.withCredentials).toBe(true)
    expect(createCfg.maxRedirects).toBeUndefined()
    expect(createCfg.beforeRedirect).toBeUndefined()

    expect(clientSource).toMatch(/withCredentials:\s*true/)
    expect(clientSource).not.toMatch(/maxRedirects/)
    expect(clientSource).not.toMatch(/beforeRedirect/)
  })

  it('interceptor não força maxRedirects: 0 em GET /auth/me nem POST /auth/login', () => {
    const meConfig = axiosMocks.handlers.requestFulfilled({
      method: 'get',
      url: '/auth/me',
      headers: {}
    })
    expect(meConfig.maxRedirects).toBeUndefined()
    expect(meConfig.withCredentials).toBeUndefined()

    const loginConfig = axiosMocks.handlers.requestFulfilled({
      method: 'post',
      url: '/auth/login',
      headers: {},
      data: { email: 'ana@exemplo.com', password: 'Segredo1!' }
    })
    expect(loginConfig.maxRedirects).toBeUndefined()
  })

  it('setBaseURL grava qualquer URL no default — sem allowlist de origem', () => {
    const setFn = clientSource.slice(
      clientSource.indexOf('export const setBaseURL'),
      clientSource.indexOf('export const setAuthHeader')
    )

    expect(setFn).toMatch(/client\.defaults\.baseURL = url/)
    expect(setFn).not.toMatch(/startsWith|origin|allowlist|whitelist|URL\(/)
    expect(setFn).not.toMatch(/https:\/\/|evil|throw/)

    setBaseURL('https://collector.example/api')
    expect(axiosMocks.instance.defaults.baseURL).toBe('https://collector.example/api')
  })
})
