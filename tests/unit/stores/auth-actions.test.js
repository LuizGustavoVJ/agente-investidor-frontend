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

describe('Auth Store — fluxos de autenticação', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  describe('login', () => {
    it('persiste usuário não sensível e marca autenticado em sucesso', async () => {
      const user = { id: 7, name: 'Ana', email: 'ana@email.com' }
      authAPI.login.mockResolvedValue({
        data: { success: true, user }
      })

      const result = await store.login({ email: 'ana@email.com', password: 'secret' })

      expect(result).toEqual({ success: true })
      expect(store.user).toEqual(user)
      expect(store.isAuthenticated).toBe(true)
      expect(store.error).toBeNull()
      expect(sessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user))
      expect(store.isLoading).toBe(false)
      expect(store.isInitialized).toBe(false)
    })

    it('usa a mensagem do backend quando success é false', async () => {
      authAPI.login.mockResolvedValue({
        data: { success: false, message: 'Credenciais inválidas' }
      })

      const result = await store.login({ email: 'ana@email.com', password: 'errada' })

      expect(result).toEqual({ success: false, error: 'Credenciais inválidas' })
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBe('Credenciais inválidas')
    })

    it('prioriza err.response.data.message em falha HTTP', async () => {
      authAPI.login.mockRejectedValue({
        response: { data: { message: 'Conta bloqueada' } },
        message: 'Request failed'
      })

      const result = await store.login({ email: 'ana@email.com', password: 'x' })

      expect(result.error).toBe('Conta bloqueada')
      expect(store.error).toBe('Conta bloqueada')
    })
  })

  describe('register', () => {
    it('faz auto-login após cadastro bem-sucedido', async () => {
      const user = { id: 2, email: 'nova@email.com' }
      authAPI.register.mockResolvedValue({ data: { success: true } })
      authAPI.login.mockResolvedValue({ data: { success: true, user } })

      const result = await store.register({
        email: 'nova@email.com',
        password: 'Senha123'
      })

      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'nova@email.com',
        password: 'Senha123'
      })
      expect(result).toEqual({ success: true })
      expect(store.user).toEqual(user)
    })

    it('não tenta login quando o cadastro falha', async () => {
      authAPI.register.mockResolvedValue({
        data: { success: false, message: 'Email já está em uso' }
      })

      const result = await store.register({ email: 'nova@email.com', password: 'x' })

      expect(authAPI.login).not.toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Email já está em uso')
    })
  })

  describe('logout', () => {
    it('limpa usuário e sessionStorage mesmo se a API falhar', async () => {
      store.user = { id: 1, name: 'Ana' }
      authAPI.logout.mockRejectedValue(new Error('network'))

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('checkAuthStatus', () => {
    it('hidrata usuário local e confirma com o backend', async () => {
      const stored = { id: 1, name: 'Cache' }
      const fresh = { id: 1, name: 'Atualizado', email: 'a@email.com' }
      sessionStorage.getItem.mockReturnValue(JSON.stringify(stored))
      authAPI.checkAuth.mockResolvedValue({
        data: { success: true, user: fresh }
      })

      const result = await store.checkAuthStatus()

      expect(result).toBe(true)
      expect(store.user).toEqual(fresh)
      expect(store.isInitialized).toBe(true)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(fresh))
    })

    it('marca autenticado com sessão local antes do backend responder', async () => {
      sessionStorage.getItem.mockReturnValue(JSON.stringify({ id: 9, name: 'Stale' }))
      let release
      authAPI.checkAuth.mockImplementation(() => new Promise(resolve => {
        release = resolve
      }))

      const pending = store.checkAuthStatus()
      await Promise.resolve()

      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual({ id: 9, name: 'Stale' })

      release({ data: { success: false } })
      await pending
      expect(store.isAuthenticated).toBe(false)
    })

    it('limpa sessão quando o token está inválido', async () => {
      sessionStorage.getItem.mockReturnValue(JSON.stringify({ id: 1 }))
      authAPI.checkAuth.mockResolvedValue({
        data: { success: false }
      })

      const result = await store.checkAuthStatus()

      expect(result).toBe(false)
      expect(store.user).toBeNull()
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
      expect(store.isInitialized).toBe(true)
    })

    it('trata erro de rede como sessão inválida', async () => {
      authAPI.checkAuth.mockRejectedValue(new Error('offline'))

      const result = await store.checkAuthStatus()

      expect(result).toBe(false)
      expect(store.user).toBeNull()
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('updateProfile', () => {
    it('mescla dados retornados sem descartar campos locais', async () => {
      store.user = { id: 1, name: 'Ana', phone: '1199' }
      authAPI.updateProfile.mockResolvedValue({
        data: { success: true, user: { name: 'Ana Clara' } }
      })

      const result = await store.updateProfile({ name: 'Ana Clara' })

      expect(result.success).toBe(true)
      expect(store.user).toEqual({ id: 1, name: 'Ana Clara', phone: '1199' })
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify({ id: 1, name: 'Ana Clara', phone: '1199' })
      )
    })
  })

  describe('initialize', () => {
    it('não verifica autenticação duas vezes', async () => {
      authAPI.checkAuth.mockResolvedValue({
        data: { success: true, user: { id: 1 } }
      })

      await store.initialize()
      await store.initialize()

      expect(authAPI.checkAuth).toHaveBeenCalledTimes(1)
    })
  })
})
