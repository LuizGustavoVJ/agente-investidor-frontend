import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  initialize: vi.fn()
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authState
}))

import { applyMiddlewares, requireAuth } from '@/middleware/auth'

const to = { name: 'Dashboard', fullPath: '/dashboard', path: '/dashboard' }
const from = { name: 'Home', fullPath: '/', path: '/' }

describe('applyMiddlewares — falha no meio e concorrência', () => {
  let next

  beforeEach(() => {
    next = vi.fn()
    vi.clearAllMocks()
    authState.isAuthenticated = false
    authState.isInitialized = false
    authState.user = null
  })

  it('rejeita e não chama next quando o primeiro middleware lança', async () => {
    const boom = vi.fn(() => {
      throw new Error('pipeline failed')
    })
    const neverCalled = vi.fn()

    await expect(applyMiddlewares([boom, neverCalled])(to, from, next)).rejects.toThrow(
      'pipeline failed'
    )

    expect(neverCalled).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('não chama next se um middleware nunca invoca o callback', async () => {
    const silent = vi.fn(() => {})

    await applyMiddlewares([silent])(to, from, next)

    expect(silent).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()
  })

  it('resolve antes do next quando o próximo middleware é async (runMiddleware sem await)', async () => {
    let releaseSecond
    const first = vi.fn((routeTo, routeFrom, nxt) => nxt())
    const second = vi.fn(async (routeTo, routeFrom, nxt) => {
      await new Promise((resolve) => {
        releaseSecond = resolve
      })
      nxt()
    })

    const combinedDone = applyMiddlewares([first, second])(to, from, next)
    await combinedDone

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()

    releaseSecond()
    await Promise.resolve()
    await Promise.resolve()

    expect(next).toHaveBeenCalledWith()
  })
})

describe('requireAuth — initialize rejeitado', () => {
  let next

  beforeEach(() => {
    next = vi.fn()
    vi.clearAllMocks()
    authState.isAuthenticated = false
    authState.isInitialized = false
    authState.user = null
  })

  it('não chama next quando initialize lança — a navegação fica sem destino', async () => {
    authState.initialize.mockRejectedValue(new Error('session check failed'))

    await expect(requireAuth(to, from, next)).rejects.toThrow('session check failed')
    expect(authState.initialize).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()
  })
})
