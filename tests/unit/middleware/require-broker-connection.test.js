import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  isInitialized: true,
  isAuthenticated: true,
  user: { id: 'u-1' },
  initialize: vi.fn()
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authState
}))

import { requireBrokerConnection } from '@/middleware/auth'

describe('requireBrokerConnection', () => {
  let next

  beforeEach(() => {
    next = vi.fn()
    authState.isInitialized = true
    authState.isAuthenticated = true
    authState.user = { id: 'u-1' }
  })

  it('não consulta corretoras e libera a rota mesmo sem conexão', async () => {
    await requireBrokerConnection(
      { name: 'Analises', fullPath: '/analises', path: '/analises' },
      { name: 'Dashboard', path: '/dashboard' },
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
  })

  it('só exige autenticação: visitante vai para Login', async () => {
    authState.isAuthenticated = false

    await requireBrokerConnection(
      { name: 'Corretoras', fullPath: '/corretoras', path: '/corretoras' },
      { name: 'Home', path: '/' },
      next
    )

    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/corretoras' }
    })
  })
})
