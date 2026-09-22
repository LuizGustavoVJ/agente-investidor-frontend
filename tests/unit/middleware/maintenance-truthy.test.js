import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isInitialized: true,
  user: null,
  initialize: vi.fn()
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authState
}))

import { checkMaintenance } from '@/middleware/auth'

const toDashboard = { name: 'Dashboard', fullPath: '/dashboard', path: '/dashboard' }
const fromHome = { name: 'Home', fullPath: '/', path: '/' }

describe('checkMaintenance — só a string exata "true" ativa o modo', () => {
  let next

  beforeEach(() => {
    next = vi.fn()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each(['1', 'True', 'TRUE', 'yes', 'on'])(
    'VITE_MAINTENANCE_MODE=%s não redireciona — o operador espera manutenção e o app segue aberto',
    (value) => {
      vi.stubEnv('VITE_MAINTENANCE_MODE', value)

      checkMaintenance(toDashboard, fromHome, next)

      expect(next).toHaveBeenCalledWith()
      expect(next).not.toHaveBeenCalledWith({ name: 'Maintenance' })
    }
  )

  it('string "true" redireciona para Maintenance', () => {
    vi.stubEnv('VITE_MAINTENANCE_MODE', 'true')

    checkMaintenance(toDashboard, fromHome, next)

    expect(next).toHaveBeenCalledWith({ name: 'Maintenance' })
  })
})
