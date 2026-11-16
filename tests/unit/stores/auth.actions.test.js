import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { authAPI } = vi.hoisted(() => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

vi.mock('@/api/auth', () => ({ authAPI }))

import { useAuthStore } from '@/stores/auth'

const memoryStorage = () => {
  const data = {}
  sessionStorage.getItem.mockImplementation((key) => (key in data ? data[key] : null))
  sessionStorage.setItem.mockImplementation((key, value) => {
    data[key] = String(value)
  })
  sessionStorage.removeItem.mockImplementation((key) => {
    delete data[key]
  })
  sessionStorage.clear.mockImplementation(() => {
    Object.keys(data).forEach((key) => delete data[key])
  })
  return data
}

describe('Auth store — ações de sessão', () => {
  let store
  let storage

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    storage = memoryStorage()
    vi.clearAllMocks()
    window.location.pathname = '/'
    window.location.href = 'http://localhost:3000/'
  })

  describe('login', () => {
    it('persiste só o usuário em sessionStorage e não grava token', async () => {
      authAPI.login.mockResolvedValue({
        data: {
          success: true,
          user: { id: 9, name: 'Ana', email: 'ana@ex.com' },
          token: 'nao-deve-ir-para-storage'
        }
      })

      const result = await store.login({
        email: 'ana@ex.com',
        password: 'segredo',
        rememberMe: true
      })

      expect(result).toEqual({ success: true })
      expect(store.user).toEqual({ id: 9, name: 'Ana', email: 'ana@ex.com' })
      expect(store.isAuthenticated).toBe(true)
      expect(JSON.parse(storage.user)).toEqual({ id: 9, name: 'Ana', email: 'ana@ex.com' })
      expect(Object.keys(storage)).toEqual(['user'])
      expect(store.isLoading).toBe(false)
    })

    it('não autentica quando a API responde success false', async () => {
      authAPI.login.mockResolvedValue({
        data: { success: false, message: 'Credenciais inválidas' }
      })

      const result = await store.login({ email: 'ana@ex.com', password: 'x' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Credenciais inválidas')
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(storage.user).toBeUndefined()
    })

    it('usa a mensagem do backend em erro HTTP e zera loading no finally', async () => {
      authAPI.login.mockRejectedValue({
        response: { data: { message: 'Conta bloqueada' } }
      })

      const result = await store.login({ email: 'ana@ex.com', password: 'x' })

      expect(result).toEqual({ success: false, error: 'Conta bloqueada' })
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Conta bloqueada')
    })
  })

  describe('register', () => {
    it('faz auto-login só com e-mail e senha após cadastro bem-sucedido', async () => {
      authAPI.register.mockResolvedValue({ data: { success: true } })
      authAPI.login.mockResolvedValue({
        data: { success: true, user: { id: 2, email: 'nova@ex.com' } }
      })

      const result = await store.register({
        name: 'Nova',
        email: 'nova@ex.com',
        password: 'Senha123!',
        confirmPassword: 'Senha123!',
        phone: '(11) 99999-9999',
        acceptTerms: true
      })

      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'nova@ex.com',
        password: 'Senha123!'
      })
      expect(result).toEqual({ success: true })
      expect(store.user.email).toBe('nova@ex.com')
    })

    it('propaga falha de login após cadastro sem relançar exceção', async () => {
      authAPI.register.mockResolvedValue({ data: { success: true } })
      authAPI.login.mockResolvedValue({
        data: { success: false, message: 'Confirme o e-mail' }
      })

      const result = await store.register({
        email: 'nova@ex.com',
        password: 'Senha123!'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Confirme o e-mail')
      expect(store.user).toBeNull()
    })
  })

  describe('logout', () => {
    it('limpa sessão mesmo se a API falhar', async () => {
      store.user = { id: 1 }
      storage.user = JSON.stringify({ id: 1 })
      authAPI.logout.mockRejectedValue(new Error('timeout'))
      window.location.pathname = '/dashboard'

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(storage.user).toBeUndefined()
      expect(window.location.href).toBe('/login')
    })

    it('não redireciona quando já está em /login', async () => {
      store.user = { id: 1 }
      authAPI.logout.mockResolvedValue({})
      window.location.pathname = '/login'
      window.location.href = 'http://localhost:3000/login'

      await store.logout()

      expect(window.location.href).toBe('http://localhost:3000/login')
    })
  })

  describe('checkAuthStatus e initialize', () => {
    it('descarta usuário em cache quando o backend recusa a sessão', async () => {
      storage.user = JSON.stringify({ id: 1, name: 'Stale' })
      authAPI.checkAuth.mockResolvedValue({
        data: { success: false }
      })

      const ok = await store.checkAuthStatus()

      expect(ok).toBe(false)
      expect(store.user).toBeNull()
      expect(storage.user).toBeUndefined()
      expect(store.isInitialized).toBe(true)
    })

    it('sobrevive a JSON inválido no sessionStorage e marca initialize', async () => {
      storage.user = '{quebra'
      authAPI.checkAuth.mockResolvedValue({
        data: { success: true, user: { id: 3 } }
      })

      const ok = await store.checkAuthStatus()

      expect(ok).toBe(false)
      expect(store.user).toBeNull()
      expect(store.isInitialized).toBe(true)
      expect(authAPI.checkAuth).not.toHaveBeenCalled()
    })

    it('atualiza o cache quando /auth/me devolve usuário fresco', async () => {
      authAPI.checkAuth.mockResolvedValue({
        data: { success: true, user: { id: 4, name: 'Fresca' } }
      })

      const ok = await store.checkAuthStatus()

      expect(ok).toBe(true)
      expect(store.user).toEqual({ id: 4, name: 'Fresca' })
      expect(JSON.parse(storage.user).name).toBe('Fresca')
    })

    it('initialize é idempotente depois da primeira verificação', async () => {
      authAPI.checkAuth.mockResolvedValue({
        data: { success: true, user: { id: 5 } }
      })

      await store.initialize()
      await store.initialize()

      expect(authAPI.checkAuth).toHaveBeenCalledTimes(1)
    })
  })

  describe('updateProfile', () => {
    it('faz merge do perfil retornado sem descartar campos locais', async () => {
      store.user = { id: 8, name: 'Ana', permissions: ['read'] }
      authAPI.updateProfile.mockResolvedValue({
        data: { success: true, user: { name: 'Ana Souza', phone: '1199999' } }
      })

      const result = await store.updateProfile({ name: 'Ana Souza' })

      expect(result.success).toBe(true)
      expect(store.user).toEqual({
        id: 8,
        name: 'Ana Souza',
        permissions: ['read'],
        phone: '1199999'
      })
    })
  })
})
