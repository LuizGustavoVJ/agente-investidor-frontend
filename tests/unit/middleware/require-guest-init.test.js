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

import { requireGuest } from '@/middleware/auth'

const to = { name: 'Login', fullPath: '/login', path: '/login' }
const from = { name: 'Home', fullPath: '/', path: '/' }

describe('requireGuest — initialize rejeitado', () => {
  let next

  beforeEach(() => {
    next = vi.fn()
    vi.clearAllMocks()
    authState.isAuthenticated = false
    authState.isInitialized = false
    authState.user = null
  })

  it('não chama next quando initialize lança — login e cadastro ficam sem destino', async () => {
    authState.initialize.mockRejectedValue(new Error('session check failed'))

    await expect(requireGuest(to, from, next)).rejects.toThrow('session check failed')
    expect(authState.initialize).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()
  })

  it('não tenta initialize de novo se a store já marcou isInitialized', async () => {
    authState.isInitialized = true
    authState.isAuthenticated = false

    await requireGuest(to, from, next)

    expect(authState.initialize).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })
})
