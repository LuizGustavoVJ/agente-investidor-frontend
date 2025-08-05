import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // State - Apenas dados não sensíveis em memória
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const isInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userProfile = computed(() => user.value)

  // Actions
  const login = async (credentials) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await authAPI.login(credentials)
      
      if (response.data.success) {
        // O token será armazenado automaticamente em cookie HTTP-only pelo backend
        user.value = response.data.user
        
        // Armazenar apenas dados não sensíveis do usuário em sessionStorage
        sessionStorage.setItem('user', JSON.stringify(user.value))
        
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro no login')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro no login'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await authAPI.register(userData)
      
      if (response.data.success) {
        // Auto-login após registro
        return await login({
          email: userData.email,
          password: userData.password
        })
      } else {
        throw new Error(response.data.message || 'Erro no cadastro')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro no cadastro'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // Chamar API de logout para invalidar o cookie HTTP-only
      await authAPI.logout()
    } catch (err) {
      console.error('Erro no logout:', err)
    } finally {
      // Limpar dados locais
      user.value = null
      sessionStorage.removeItem('user')
      
      // Redirecionar para login se necessário
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login'
      }
    }
  }

  const checkAuthStatus = async () => {
    try {
      isLoading.value = true
      
      // Verificar se há dados do usuário em sessionStorage
      const storedUser = sessionStorage.getItem('user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
      
      // Verificar autenticação com o backend (cookie será enviado automaticamente)
      const response = await authAPI.checkAuth()
      
      if (response.data.success && response.data.user) {
        user.value = response.data.user
        sessionStorage.setItem('user', JSON.stringify(user.value))
        return true
      } else {
        // Token inválido ou expirado
        user.value = null
        sessionStorage.removeItem('user')
        return false
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err)
      user.value = null
      sessionStorage.removeItem('user')
      return false
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  const updateProfile = async (profileData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await authAPI.updateProfile(profileData)
      
      if (response.data.success) {
        user.value = { ...user.value, ...response.data.user }
        sessionStorage.setItem('user', JSON.stringify(user.value))
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar perfil')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao atualizar perfil'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Inicializar verificação de autenticação
  const initialize = async () => {
    if (!isInitialized.value) {
      await checkAuthStatus()
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    isInitialized,
    
    // Getters
    isAuthenticated,
    userProfile,
    
    // Actions
    login,
    register,
    logout,
    checkAuthStatus,
    updateProfile,
    clearError,
    initialize
  }
})

