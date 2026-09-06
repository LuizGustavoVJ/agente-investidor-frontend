import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // State - Apenas dados não sensíveis em memória
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const isInitialized = ref(false)
  const activeSessions = ref([])

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

  const persistUser = (nextUser) => {
    user.value = nextUser
    if (nextUser) {
      sessionStorage.setItem('user', JSON.stringify(nextUser))
    } else {
      sessionStorage.removeItem('user')
    }
  }

  const failAction = (err, fallbackMessage) => {
    error.value = err.response?.data?.message || err.message || fallbackMessage
    const failure = new Error(error.value)
    failure.cause = err
    throw failure
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmPassword: newPassword
      })

      if (response.data.success) {
        return { success: true }
      }

      throw new Error(response.data.message || 'Erro ao alterar senha')
    } catch (err) {
      return failAction(err, 'Erro ao alterar senha')
    } finally {
      isLoading.value = false
    }
  }

  const setup2FA = async () => {
    try {
      isLoading.value = true
      error.value = null

      const qrResponse = await authAPI.get2FAQRCode()
      const toggleResponse = await authAPI.toggle2FA(true)

      if (toggleResponse.data.success) {
        if (user.value) {
          persistUser({ ...user.value, twoFactorEnabled: true })
        }
        return { success: true, data: qrResponse.data?.data }
      }

      throw new Error(toggleResponse.data.message || 'Erro ao configurar 2FA')
    } catch (err) {
      return failAction(err, 'Erro ao configurar 2FA')
    } finally {
      isLoading.value = false
    }
  }

  const disable2FA = async () => {
    try {
      isLoading.value = true
      error.value = null

      const response = await authAPI.toggle2FA(false)

      if (response.data.success) {
        if (user.value) {
          persistUser({ ...user.value, twoFactorEnabled: false })
        }
        return { success: true }
      }

      throw new Error(response.data.message || 'Erro ao desativar 2FA')
    } catch (err) {
      return failAction(err, 'Erro ao desativar 2FA')
    } finally {
      isLoading.value = false
    }
  }

  const terminateSession = async (sessionId) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await authAPI.terminateSession(sessionId)

      if (response.data.success) {
        activeSessions.value = activeSessions.value.filter(session => session.id !== sessionId)
        return { success: true }
      }

      throw new Error(response.data.message || 'Erro ao encerrar sessão')
    } catch (err) {
      return failAction(err, 'Erro ao encerrar sessão')
    } finally {
      isLoading.value = false
    }
  }

  const exportUserData = async () => {
    try {
      isLoading.value = true
      error.value = null

      const response = await authAPI.exportUserData()
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([JSON.stringify(response.data ?? {})], { type: 'application/json' })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'meus-dados.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      return { success: true }
    } catch (err) {
      return failAction(err, 'Erro ao exportar dados')
    } finally {
      isLoading.value = false
    }
  }

  const deleteAccount = async () => {
    try {
      isLoading.value = true
      error.value = null

      const response = await authAPI.deleteAccount()

      if (response.data.success) {
        persistUser(null)
        activeSessions.value = []
        return { success: true }
      }

      throw new Error(response.data.message || 'Erro ao excluir conta')
    } catch (err) {
      return failAction(err, 'Erro ao excluir conta')
    } finally {
      isLoading.value = false
    }
  }

  const loadUserSettings = async () => {
    try {
      isLoading.value = true
      error.value = null

      const [meResponse, securityResponse] = await Promise.all([
        authAPI.checkAuth(),
        authAPI.getSecuritySettings()
      ])

      if (!(meResponse.data.success && meResponse.data.user)) {
        throw new Error(meResponse.data.message || 'Erro ao carregar configurações')
      }

      const securityData = securityResponse.data?.data || securityResponse.data || {}
      persistUser({
        ...meResponse.data.user,
        twoFactorEnabled: securityData.twoFactorEnabled ?? meResponse.data.user.twoFactorEnabled
      })
      activeSessions.value = securityData.sessions || securityData.activeSessions || []

      return { success: true }
    } catch (err) {
      return failAction(err, 'Erro ao carregar configurações')
    } finally {
      isLoading.value = false
    }
  }

  const updateInvestorProfile = async (investorProfile) => {
    const result = await updateProfile({ investorProfile })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result
  }

  const updateNotificationSettings = async (notificationSettings) => {
    const result = await updateProfile({ notificationSettings })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result
  }

  const updatePrivacySettings = async (privacySettings) => {
    const result = await updateProfile({ privacySettings })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result
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
    activeSessions,
    
    // Getters
    isAuthenticated,
    userProfile,
    
    // Actions
    login,
    register,
    logout,
    checkAuthStatus,
    updateProfile,
    changePassword,
    setup2FA,
    disable2FA,
    terminateSession,
    exportUserData,
    deleteAccount,
    loadUserSettings,
    updateInvestorProfile,
    updateNotificationSettings,
    updatePrivacySettings,
    clearError,
    initialize
  }
})

