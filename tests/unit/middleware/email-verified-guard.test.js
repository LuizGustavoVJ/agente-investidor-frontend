import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { requireEmailVerified } from '@/middleware/auth'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    checkAuth: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('requireEmailVerified', () => {
  let next
  const to = { fullPath: '/analises' }
  const from = { fullPath: '/' }

  beforeEach(() => {
    setActivePinia(createPinia())
    next = vi.fn()
  })

  it('não chama initialize antes de decidir', async () => {
    const authStore = useAuthStore()
    const initialize = vi.spyOn(authStore, 'initialize')
    authStore.user = { email: 'a@b.com', emailVerified: true }

    await requireEmailVerified(to, from, next)

    expect(initialize).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })

  it('redireciona anônimo para Login com redirect', async () => {
    await requireEmailVerified(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/analises' }
    })
  })

  it('trata a string "false" como e-mail verificado', async () => {
    const authStore = useAuthStore()
    authStore.user = { email: 'a@b.com', emailVerified: 'false' }

    await requireEmailVerified(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('bloqueia emailVerified numérico 0 e boolean false', async () => {
    const authStore = useAuthStore()
    authStore.user = { email: 'a@b.com', emailVerified: 0 }
    await requireEmailVerified(to, from, next)
    expect(next).toHaveBeenCalledWith({
      name: 'EmailVerification',
      query: { redirect: '/analises' }
    })

    next.mockClear()
    authStore.user = { email: 'a@b.com', emailVerified: false }
    await requireEmailVerified(to, from, next)
    expect(next).toHaveBeenCalledWith({
      name: 'EmailVerification',
      query: { redirect: '/analises' }
    })
  })
})
