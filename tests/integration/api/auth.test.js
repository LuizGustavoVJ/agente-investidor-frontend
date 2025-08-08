import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { login, register, logout, refreshToken, getCurrentUser } from '@/api/auth'

// Mock do fetch global
global.fetch = vi.fn()

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    fetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockResponse = {
        user: {
          id: 1,
          name: 'João Silva',
          email: 'joao@email.com'
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      })

      const credentials = {
        email: 'joao@email.com',
        password: 'senha123'
      }

      const result = await login(credentials)

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      })

      expect(result).toEqual(mockResponse)
    })

    it('deve tratar erro 401 (credenciais inválidas)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Credenciais inválidas'
        })
      })

      const credentials = {
        email: 'joao@email.com',
        password: 'senha-errada'
      }

      await expect(login(credentials)).rejects.toThrow('Credenciais inválidas')
    })

    it('deve tratar erro 422 (dados inválidos)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          error: 'Email é obrigatório'
        })
      })

      const credentials = {
        email: '',
        password: 'senha123'
      }

      await expect(login(credentials)).rejects.toThrow('Email é obrigatório')
    })

    it('deve tratar erro de rede', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      const credentials = {
        email: 'joao@email.com',
        password: 'senha123'
      }

      await expect(login(credentials)).rejects.toThrow('Erro de conexão')
    })

    it('deve tratar resposta sem JSON válido', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      const credentials = {
        email: 'joao@email.com',
        password: 'senha123'
      }

      await expect(login(credentials)).rejects.toThrow('Erro interno do servidor')
    })
  })

  describe('register', () => {
    it('deve registrar usuário com sucesso', async () => {
      const mockResponse = {
        user: {
          id: 1,
          name: 'João Silva',
          email: 'joao@email.com'
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      })

      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
        confirmPassword: 'senha123'
      }

      const result = await register(userData)

      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      })

      expect(result).toEqual(mockResponse)
    })

    it('deve tratar erro 409 (email já existe)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Email já está em uso'
        })
      })

      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
        confirmPassword: 'senha123'
      }

      await expect(register(userData)).rejects.toThrow('Email já está em uso')
    })

    it('deve tratar erro de validação', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          error: 'Senhas não coincidem'
        })
      })

      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
        confirmPassword: 'senha456'
      }

      await expect(register(userData)).rejects.toThrow('Senhas não coincidem')
    })
  })

  describe('logout', () => {
    it('deve fazer logout com sucesso', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Logout realizado com sucesso' })
      })

      await logout()

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    })

    it('deve tratar erro de logout', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Token inválido'
        })
      })

      // Logout deve funcionar mesmo com erro (limpar estado local)
      await expect(logout()).resolves.toBeUndefined()
    })

    it('deve tratar erro de rede no logout', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      // Logout deve funcionar mesmo com erro de rede
      await expect(logout()).resolves.toBeUndefined()
    })
  })

  describe('refreshToken', () => {
    it('deve renovar token com sucesso', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      })

      const result = await refreshToken()

      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })

      expect(result).toEqual(mockResponse)
    })

    it('deve tratar erro 401 (refresh token inválido)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Refresh token inválido'
        })
      })

      await expect(refreshToken()).rejects.toThrow('Refresh token inválido')
    })

    it('deve tratar erro de rede', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(refreshToken()).rejects.toThrow('Erro de conexão')
    })
  })

  describe('getCurrentUser', () => {
    it('deve obter usuário atual com sucesso', async () => {
      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@email.com',
        profile: {
          riskProfile: 'Moderado',
          monthlyIncome: 5000
        }
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUser
      })

      const result = await getCurrentUser()

      expect(fetch).toHaveBeenCalledWith('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })

      expect(result).toEqual(mockUser)
    })

    it('deve tratar erro 401 (não autenticado)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Token não fornecido'
        })
      })

      await expect(getCurrentUser()).rejects.toThrow('Token não fornecido')
    })

    it('deve tratar erro de rede', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(getCurrentUser()).rejects.toThrow('Erro de conexão')
    })
  })

  describe('Interceptors e Headers', () => {
    it('deve incluir headers corretos nas requisições', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({})
      })

      await login({ email: 'test@email.com', password: 'password' })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          credentials: 'include'
        })
      )
    })

    it('deve incluir credentials em todas as requisições', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({})
      })

      await getCurrentUser()

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include'
        })
      )
    })
  })

  describe('Timeout e Retry', () => {
    it('deve ter timeout configurado', async () => {
      // Simular timeout
      fetch.mockImplementation(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100)
      }))

      const credentials = {
        email: 'joao@email.com',
        password: 'senha123'
      }

      await expect(login(credentials)).rejects.toThrow()
    })
  })

  describe('Validação de entrada', () => {
    it('deve validar dados de login', async () => {
      await expect(login({})).rejects.toThrow()
      await expect(login({ email: '' })).rejects.toThrow()
      await expect(login({ password: '' })).rejects.toThrow()
    })

    it('deve validar dados de registro', async () => {
      await expect(register({})).rejects.toThrow()
      await expect(register({ name: '' })).rejects.toThrow()
      await expect(register({ email: 'invalid-email' })).rejects.toThrow()
    })
  })
})

