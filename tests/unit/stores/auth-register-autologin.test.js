import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'

describe('Auth store — register auto-login e logout parcial', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.location.pathname = '/cadastro'
    window.location.href = 'http://localhost:3000/cadastro'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('register bem-sucedido dispara login com a senha em texto claro de novo', async () => {
    vi.spyOn(authAPI, 'register').mockResolvedValue({ data: { success: true } })
    vi.spyOn(authAPI, 'login').mockResolvedValue({
      data: { success: true, user: { id: 9, email: 'ana@ex.com' } }
    })

    const store = useAuthStore()
    const result = await store.register({
      email: 'ana@ex.com',
      password: 'Senha1234',
      name: 'Ana'
    })

    expect(authAPI.login).toHaveBeenCalledWith({
      email: 'ana@ex.com',
      password: 'Senha1234'
    })
    expect(result).toEqual({ success: true })
    expect(store.user).toEqual({ id: 9, email: 'ana@ex.com' })
  })

  it('register API ok + login falho devolve falha — conta pode ter sido criada sem sessão', async () => {
    vi.spyOn(authAPI, 'register').mockResolvedValue({ data: { success: true } })
    vi.spyOn(authAPI, 'login').mockResolvedValue({
      data: { success: false, message: '2FA pending' }
    })

    const store = useAuthStore()
    const result = await store.register({
      email: 'ana@ex.com',
      password: 'Senha1234'
    })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/2FA|login/i)
    expect(store.user).toBeNull()
  })

  it('logout em /login ou / não redireciona; em /dashboard redireciona', async () => {
    vi.spyOn(authAPI, 'logout').mockRejectedValue(new Error('offline'))
    const store = useAuthStore()
    store.user = { id: 1 }

    window.location.pathname = '/login'
    await store.logout()
    expect(store.user).toBeNull()
    expect(window.location.href).toBe('http://localhost:3000/cadastro')

    store.user = { id: 1 }
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
    await store.logout()
    expect(window.location.href).toBe('/login')
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('JSON stale no sessionStorage é engolido e a sessão local some', async () => {
    sessionStorage.getItem.mockReturnValue('{not-json')
    vi.spyOn(authAPI, 'checkAuth').mockResolvedValue({
      data: { success: true, user: { id: 1 } }
    })

    const store = useAuthStore()
    const result = await store.checkAuthStatus()

    expect(result).toBe(false)
    expect(store.user).toBeNull()
    expect(authAPI.checkAuth).not.toHaveBeenCalled()
  })
})
