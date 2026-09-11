import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    logout: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('Auth store — logout em páginas guest além de / e /login', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    authAPI.logout.mockResolvedValue({ data: { success: true } })
    store.user = { id: 'u-1', name: 'Ana' }
    window.location.href = 'http://localhost:3000/'
  })

  it('logout em /cadastro redireciona para /login (cadastro não é tratado como público)', async () => {
    window.location.pathname = '/cadastro'

    await store.logout()

    expect(store.user).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('logout em /termos e /privacidade também expulsa para /login', async () => {
    window.location.pathname = '/termos'
    await store.logout()
    expect(window.location.href).toBe('/login')

    store.user = { id: 'u-1' }
    window.location.href = 'http://localhost:3000/privacidade'
    window.location.pathname = '/privacidade'
    await store.logout()
    expect(window.location.href).toBe('/login')
  })

  it('logout em /login não redireciona', async () => {
    window.location.pathname = '/login'
    window.location.href = 'http://localhost:3000/login'

    await store.logout()

    expect(store.user).toBeNull()
    expect(window.location.href).toBe('http://localhost:3000/login')
  })
})
