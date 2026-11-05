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

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ logout: vi.fn() })
}))

import '@/api/client'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')

describe('HTTP client — interceptor de erro loga URL e message fora de DEV', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('console.error do interceptor de resposta não está atrás de import.meta.env.DEV', () => {
    const errorHandler = clientSource.slice(
      clientSource.indexOf('async (error) =>'),
      clientSource.indexOf('// Tratamento de erro 401')
    )

    expect(errorHandler).toMatch(/console\.error\(`❌ \$\{error\.config\?\.method/)
    expect(errorHandler).toMatch(/error\.config\?\.url/)
    expect(errorHandler).toMatch(/error\.response\?\.data\?\.message/)
    expect(errorHandler).not.toMatch(/import\.meta\.env\.DEV/)
  })

  it('500 em análise compartilhada escreve o token da URL e a message no console — inclusive fora de DEV', async () => {
    const shareUrl = '/analysis/shared/tok_live_ana-carteira-2026'
    const serverMessage = 'share token inválido: tok_live_ana-carteira-2026'

    await axiosMocks.handlers.responseRejected({
      config: { url: shareUrl, method: 'get' },
      response: { status: 500, data: { message: serverMessage } },
      message: 'Request failed with status code 500'
    }).catch(() => {})

    expect(console.error).toHaveBeenCalled()
    const logged = console.error.mock.calls.map((args) => JSON.stringify(args)).join('\n')
    expect(logged).toContain(shareUrl)
    expect(logged).toContain('tok_live_ana-carteira-2026')
    expect(logged).toContain(serverMessage)
  })
})
