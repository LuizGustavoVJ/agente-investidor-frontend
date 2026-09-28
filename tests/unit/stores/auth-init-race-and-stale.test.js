import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    refreshToken: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import { authAPI } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

function deferred() {
  let resolve
  let rejectFn
  const promise = new Promise((res, rej) => {
    resolve = res
    rejectFn = rej
  })
  return { promise, resolve, reject: rejectFn }
}

describe('Auth Store — initialize concorrente e hidratação stale', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('dois initialize() simultâneos disparam dois GET /auth/me (sem lock)', async () => {
    const first = deferred()
    const second = deferred()
    let calls = 0
    authAPI.checkAuth.mockImplementation(() => {
      calls += 1
      return calls === 1 ? first.promise : second.promise
    })
    sessionStorage.getItem.mockReturnValue(null)

    const p1 = store.initialize()
    const p2 = store.initialize()
    await Promise.resolve()

    expect(authAPI.checkAuth).toHaveBeenCalledTimes(2)

    first.resolve({ data: { success: true, user: { id: 1, name: 'A' } } })
    second.resolve({ data: { success: true, user: { id: 1, name: 'B' } } })
    await Promise.all([p1, p2])

    expect(store.user).toEqual({ id: 1, name: 'B' })
    expect(store.isInitialized).toBe(true)
  })

  it('expõe usuário stale do sessionStorage antes do backend invalidar o cookie', async () => {
    const check = deferred()
    sessionStorage.getItem.mockReturnValue(
      JSON.stringify({ id: 9, name: 'Sessão velha' })
    )
    authAPI.checkAuth.mockReturnValue(check.promise)

    const pending = store.checkAuthStatus()
    await Promise.resolve()

    expect(store.user).toEqual({ id: 9, name: 'Sessão velha' })
    expect(store.isAuthenticated).toBe(true)

    check.resolve({ data: { success: false } })
    const ok = await pending

    expect(ok).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
  })
})
