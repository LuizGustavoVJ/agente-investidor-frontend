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

import { authAPI } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store — ações de autenticação', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
    window.location.pathname = '/'
    window.location.href = 'http://localhost:3000/'
  })

  describe('login', () => {
    it('persiste usuário não sensível após login bem-sucedido', async () => {
      const user = { id: 1, name: 'João', email: 'joao@email.com' }
      authAPI.login.mockResolvedValue({ data: { success: true, user } })

      const result = await store.login({ email: 'joao@email.com', password: 'secret' })

      expect(result).toEqual({ success: true })
      expect(store.user).toEqual(user)
      expect(store.isAuthenticated).toBe(true)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user))
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('não autentica quando a API retorna success false', async () => {
      authAPI.login.mockResolvedValue({ data: { success: false, message: 'Credenciais inválidas' } })

      const result = await store.login({ email: 'joao@email.com', password: 'errada' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Credenciais inválidas')
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(sessionStorage.setItem).not.toHaveBeenCalled()
    })

    it('usa mensagem do response da API em erro HTTP', async () => {
      const error = new Error('Request failed')
      error.response = { data: { message: 'Conta bloqueada' } }
      authAPI.login.mockRejectedValue(error)

      const result = await store.login({ email: 'joao@email.com', password: 'x' })

      expect(result).toEqual({ success: false, error: 'Conta bloqueada' })
      expect(store.error).toBe('Conta bloqueada')
    })
  })

  describe('register', () => {
    it('faz auto-login após cadastro bem-sucedido', async () => {
      const user = { id: 2, name: 'Maria', email: 'maria@email.com' }
      authAPI.register.mockResolvedValue({ data: { success: true } })
      authAPI.login.mockResolvedValue({ data: { success: true, user } })

      const result = await store.register({
        name: 'Maria',
        email: 'maria@email.com',
        password: 'SenhaForte1'
      })

      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'maria@email.com',
        password: 'SenhaForte1'
      })
      expect(result.success).toBe(true)
      expect(store.isAuthenticated).toBe(true)
    })

    it('não tenta login se o cadastro falhar', async () => {
      authAPI.register.mockResolvedValue({ data: { success: false, message: 'Email já existe' } })

      const result = await store.register({ email: 'joao@email.com', password: 'x' })

      expect(authAPI.login).not.toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(store.error).toBe('Email já existe')
    })
  })

  describe('logout', () => {
    it('limpa usuário e sessionStorage mesmo se a API falhar', async () => {
      store.user = { id: 1, name: 'João' }
      authAPI.logout.mockRejectedValue(new Error('network'))

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('redireciona para login quando a rota atual não é pública', async () => {
      store.user = { id: 1 }
      authAPI.logout.mockResolvedValue({})
      window.location.pathname = '/dashboard'

      await store.logout()

      expect(window.location.href).toBe('/login')
    })

    it('não redireciona quando já está em /login ou /', async () => {
      store.user = { id: 1 }
      authAPI.logout.mockResolvedValue({})
      window.location.pathname = '/login'
      window.location.href = 'http://localhost:3000/login'

      await store.logout()

      expect(window.location.href).toBe('http://localhost:3000/login')
    })
  })

  describe('checkAuthStatus e initialize', () => {
    it('hidrata usuário do sessionStorage e confirma no backend', async () => {
      const stored = { id: 1, name: 'João' }
      const fresh = { id: 1, name: 'João Silva', email: 'joao@email.com' }
      sessionStorage.getItem.mockReturnValue(JSON.stringify(stored))
      authAPI.checkAuth.mockResolvedValue({ data: { success: true, user: fresh } })

      const result = await store.checkAuthStatus()

      expect(result).toBe(true)
      expect(store.user).toEqual(fresh)
      expect(store.isInitialized).toBe(true)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(fresh))
    })

    it('limpa sessão quando o token está inválido', async () => {
      sessionStorage.getItem.mockReturnValue(JSON.stringify({ id: 1 }))
      authAPI.checkAuth.mockResolvedValue({ data: { success: false } })

      const result = await store.checkAuthStatus()

      expect(result).toBe(false)
      expect(store.user).toBeNull()
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
      expect(store.isInitialized).toBe(true)
    })

    it('trata falha de rede como não autenticado e marca store como inicializada', async () => {
      authAPI.checkAuth.mockRejectedValue(new Error('timeout'))

      const result = await store.checkAuthStatus()

      expect(result).toBe(false)
      expect(store.user).toBeNull()
      expect(store.isInitialized).toBe(true)
      expect(store.isLoading).toBe(false)
    })

    it('initialize não chama checkAuthStatus novamente se já inicializado', async () => {
      store.isInitialized = true

      await store.initialize()

      expect(authAPI.checkAuth).not.toHaveBeenCalled()
    })
  })

  describe('updateProfile', () => {
    it('mescla dados retornados sem descartar campos existentes', async () => {
      store.user = { id: 1, name: 'João', phone: '11999999999' }
      authAPI.updateProfile.mockResolvedValue({
        data: { success: true, user: { name: 'João Silva' } }
      })

      const result = await store.updateProfile({ name: 'João Silva' })

      expect(result.success).toBe(true)
      expect(store.user).toEqual({ id: 1, name: 'João Silva', phone: '11999999999' })
    })
  })
})
