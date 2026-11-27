import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

import { authAPI } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

describe('Auth: logout redireciona em páginas públicas que não são / ou /login', () => {
  let store
  let originalPathname
  let originalHref

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    window.location.pathname = '/'
    window.location.href = 'http://localhost:3000/'
    originalPathname = window.location.pathname
    originalHref = window.location.href
    authAPI.logout.mockResolvedValue({ data: { success: true } })
    store.user = { id: 1, name: 'Ana' }
  })

  afterEach(() => {
    window.location.pathname = originalPathname
    window.location.href = originalHref
  })

  const setPath = (pathname) => {
    window.location.pathname = pathname
    window.location.href = `http://localhost:3000${pathname}`
  }

  it.each(['/termos', '/privacidade', '/ajuda', '/sobre', '/403', '/500', '/manutencao', '/cadastro'])(
    'logout em %s envia para /login',
    async (pathname) => {
      setPath(pathname)

      await store.logout()

      expect(store.user).toBeNull()
      expect(window.location.href).toBe('/login')
    }
  )

  it('logout em / e /login não redireciona', async () => {
    setPath('/')
    await store.logout()
    expect(window.location.href).toBe('http://localhost:3000/')

    setPath('/login')
    store.user = { id: 2 }
    await store.logout()
    expect(window.location.href).toBe('http://localhost:3000/login')
  })
})
