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

describe('requireCompleteProfile — placeholders truthy não-string', () => {
  const next = vi.fn()
  const to = { fullPath: '/dashboard' }
  const from = { fullPath: '/login' }

  beforeEach(() => {
    vi.clearAllMocks()
    authStore.isAuthenticated = true
    authStore.user = null
  })

  it('name [] e phone true passam no every() e liberam a rota', async () => {
    authStore.user = {
      name: [],
      email: 'ana@email.com',
      phone: true
    }

    await requireCompleteProfile(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('name {} e email true também contam como perfil completo', async () => {
    authStore.user = {
      name: {},
      email: true,
      phone: '11999999999'
    }

    await requireCompleteProfile(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('name 0 é falsy e manda para ProfileSetup', async () => {
    authStore.user = {
      name: 0,
      email: 'ana@email.com',
      phone: '11999999999'
    }

    await requireCompleteProfile(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'ProfileSetup',
      query: { redirect: '/dashboard' }
    })
  })
})
