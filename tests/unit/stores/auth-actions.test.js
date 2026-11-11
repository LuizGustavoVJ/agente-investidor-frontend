import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('Auth store — fluxos de autenticação', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
    vi.clearAllMocks()
    window.location.href = 'http://localhost:3000'
    window.location.pathname = '/'
  })

  describe('login', () => {
    it('persiste usuário não sensível no sessionStorage e autentica', async () => {
      const user = { id: 10, name: 'João', email: 'joao@test.com' }
      authAPI.login.mockResolvedValue({ data: { success: true, user } })

      const result = await store.login({ email: 'joao@test.com', password: 'senha123' })

      expect(result).toEqual({ success: true })
      expect(store.user).toEqual(user)
      expect(store.isAuthenticated).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(sessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user))
    })

    it('não autentica quando a API responde success=false', async () => {
      authAPI.login.mockResolvedValue({ data: { success: false, message: 'Credenciais inválidas' } })

      const result = await store.login({ email: 'joao@test.com', password: 'errada' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Credenciais inválidas')
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(sessionStorage.setItem).not.toHaveBeenCalled()
    })

    it('usa a mensagem do response da API em erro HTTP', async () => {
      authAPI.login.mockRejectedValue({
        response: { data: { message: 'Conta bloqueada' } },
        message: 'Request failed'
      })

      const result = await store.login({ email: 'joao@test.com', password: 'x' })

      expect(result).toEqual({ success: false, error: 'Conta bloqueada' })
      expect(store.error).toBe('Conta bloqueada')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('register', () => {
    it('faz auto-login com email e senha após cadastro bem-sucedido', async () => {
      const userData = {
        name: 'Maria',
        email: 'maria@test.com',
        password: 'SenhaForte1!',
        confirmPassword: 'SenhaForte1!',
        phone: '(11) 98888-7777'
      }
      authAPI.register.mockResolvedValue({ data: { success: true } })
      authAPI.login.mockResolvedValue({
        data: { success: true, user: { id: 2, email: userData.email, name: userData.name } }
      })

      const result = await store.register(userData)

      expect(authAPI.register).toHaveBeenCalledWith(userData)
      expect(authAPI.login).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password
      })
      expect(result.success).toBe(true)
      expect(store.isAuthenticated).toBe(true)
    })

    it('não tenta login quando o cadastro falha', async () => {
      authAPI.register.mockResolvedValue({ data: { success: false, message: 'Email já cadastrado' } })

      const result = await store.register({ email: 'dup@test.com', password: 'x' })

      expect(authAPI.login).not.toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Email já cadastrado')
    })
  })

  describe('logout', () => {
    it('limpa usuário e sessionStorage mesmo se a API falhar', async () => {
      store.user = { id: 1 }
      authAPI.logout.mockRejectedValue(new Error('rede'))
      window.location.pathname = '/'

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('redireciona para /login quando a sessão não está em rota pública', async () => {
      store.user = { id: 1 }
      authAPI.logout.mockResolvedValue({ data: { success: true } })
      window.location.pathname = '/dashboard'

      await store.logout()

      expect(window.location.href).toBe('/login')
    })

    it('não redireciona se já estiver em /login', async () => {
      store.user = { id: 1 }
      authAPI.logout.mockResolvedValue({ data: { success: true } })
      window.location.pathname = '/login'
      window.location.href = 'http://localhost:3000/login'

      await store.logout()

      expect(window.location.href).toBe('http://localhost:3000/login')
    })
  })

  describe('checkAuthStatus', () => {
    it('hidrata o usuário do sessionStorage e confirma com o backend', async () => {
      const stored = { id: 3, name: 'Cache' }
      const fresh = { id: 3, name: 'Atualizado', email: 'a@test.com' }
      sessionStorage.getItem.mockReturnValue(JSON.stringify(stored))
      authAPI.checkAuth.mockResolvedValue({ data: { success: true, user: fresh } })

      const ok = await store.checkAuthStatus()

      expect(ok).toBe(true)
      expect(store.user).toEqual(fresh)
      expect(store.isInitialized).toBe(true)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(fresh))
    })

    it('limpa sessão quando o backend rejeita o cookie', async () => {
      sessionStorage.getItem.mockReturnValue(JSON.stringify({ id: 1 }))
      authAPI.checkAuth.mockResolvedValue({ data: { success: false } })

      const ok = await store.checkAuthStatus()

      expect(ok).toBe(false)
      expect(store.user).toBeNull()
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('trata JSON corrompido no sessionStorage como sessão inválida', async () => {
      sessionStorage.getItem.mockReturnValue('{nao-json')
      authAPI.checkAuth.mockResolvedValue({ data: { success: true, user: { id: 1 } } })

      const ok = await store.checkAuthStatus()

      expect(ok).toBe(false)
      expect(store.user).toBeNull()
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
      expect(authAPI.checkAuth).not.toHaveBeenCalled()
    })
  })

  describe('initialize', () => {
    it('não chama o backend de novo se já inicializou', async () => {
      store.isInitialized = true

      await store.initialize()

      expect(authAPI.checkAuth).not.toHaveBeenCalled()
    })
  })

  describe('updateProfile', () => {
    it('mescla o perfil retornado sem descartar campos locais', async () => {
      store.user = { id: 4, name: 'Old', email: 'old@test.com', phone: '111' }
      authAPI.updateProfile.mockResolvedValue({
        data: { success: true, user: { name: 'Novo', phone: '222' } }
      })

      const result = await store.updateProfile({ name: 'Novo' })

      expect(result.success).toBe(true)
      expect(store.user).toEqual({
        id: 4,
        name: 'Novo',
        email: 'old@test.com',
        phone: '222'
      })
      expect(sessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(store.user))
    })
  })
})
