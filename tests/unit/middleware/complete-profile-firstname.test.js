import { describe, it, expect, beforeEach, vi } from 'vitest'

const authStore = vi.hoisted(() => ({
  isAuthenticated: true,
  isInitialized: true,
  user: null,
  initialize: vi.fn()
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore
}))

import { requireCompleteProfile } from '@/middleware/auth'

describe('requireCompleteProfile — firstName/lastName sem name', () => {
  const next = vi.fn()
  const to = { fullPath: '/dashboard' }
  const from = { fullPath: '/' }

  beforeEach(() => {
    vi.clearAllMocks()
    authStore.isAuthenticated = true
    authStore.user = null
  })

  it('perfil gravado em Configurações (firstName/lastName/email/phone) é tratado como incompleto', async () => {
    authStore.user = {
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@exemplo.com',
      phone: '(11) 99999-9999'
    }

    await requireCompleteProfile(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'ProfileSetup',
      query: { redirect: '/dashboard' }
    })
  })

  it('usuário com name preenchido passa mesmo sem firstName', async () => {
    authStore.user = {
      name: 'Ana Silva',
      email: 'ana@exemplo.com',
      phone: '(11) 99999-9999'
    }

    await requireCompleteProfile(to, from, next)

    expect(next).toHaveBeenCalledWith()
    expect(next).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ProfileSetup' })
    )
  })
})
