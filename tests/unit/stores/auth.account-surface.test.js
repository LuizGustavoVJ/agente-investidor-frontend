import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import { useAuthStore } from '@/stores/auth'

describe('Auth store — superfície de conta usada pelas configurações', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
  })

  it('não exporta as ações que Configuracoes.vue chama', () => {
    const missing = [
      'changePassword',
      'setup2FA',
      'disable2FA',
      'deleteAccount',
      'terminateSession',
      'updateInvestorProfile',
      'updateNotificationSettings',
      'updatePrivacySettings',
      'exportUserData',
      'loadUserSettings'
    ]

    for (const action of missing) {
      expect(store[action]).toBeUndefined()
    }
    expect(store.activeSessions).toBeUndefined()
  })

  it('expõe updateProfile, que é o único caminho de conta persistido na store', () => {
    expect(typeof store.updateProfile).toBe('function')
    expect(typeof store.login).toBe('function')
    expect(typeof store.logout).toBe('function')
  })
})
