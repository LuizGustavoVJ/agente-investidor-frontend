import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  describe('Estado inicial', () => {
    it('deve ter estado inicial correto', () => {
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.isLoading).toBe(false)
      expect(authStore.error).toBeNull()
    })
  })

  describe('Propriedades básicas', () => {
    it('deve ter propriedades necessárias', () => {
      expect(authStore).toHaveProperty('user')
      expect(authStore).toHaveProperty('isAuthenticated')
      expect(authStore).toHaveProperty('isLoading')
      expect(authStore).toHaveProperty('error')
    })

    it('deve ter métodos necessários', () => {
      expect(typeof authStore.login).toBe('function')
      expect(typeof authStore.logout).toBe('function')
      expect(typeof authStore.clearError).toBe('function')
    })
  })

  describe('Autenticação', () => {
    it('deve alterar estado de autenticação', () => {
      // Simular usuário logado
      authStore.user = { id: 1, name: 'João Silva' }
      
      expect(authStore.isAuthenticated).toBe(true)
    })

    it('deve limpar usuário no logout', async () => {
      // Simular usuário logado
      authStore.user = { id: 1, name: 'João Silva' }
      
      // Fazer logout
      await authStore.logout()
      
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })
  })

  describe('Gerenciamento de erro', () => {
    it('deve limpar erro', () => {
      authStore.error = 'Algum erro'
      
      authStore.clearError()
      
      expect(authStore.error).toBeNull()
    })
  })

  describe('Estado de loading', () => {
    it('deve gerenciar estado de loading', () => {
      authStore.isLoading = true
      expect(authStore.isLoading).toBe(true)
      
      authStore.isLoading = false
      expect(authStore.isLoading).toBe(false)
    })
  })
})

