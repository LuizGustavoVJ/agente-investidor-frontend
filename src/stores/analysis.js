import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { analysisAPI } from '@/api/analysis'

export const useAnalysisStore = defineStore('analysis', () => {
  // State
  const methodologies = ref([])
  const recommendations = ref([])
  const alerts = ref([])
  const analysisHistory = ref([])
  const currentAnalysis = ref(null)
  const marketAnalysis = ref(null)
  const savedAnalyses = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastUpdate = ref(null)

  // Getters
  const activeAlerts = computed(() => {
    return alerts.value.filter(alert => !alert.isRead && alert.status === 'active')
  })

  const criticalAlerts = computed(() => {
    return activeAlerts.value.filter(alert => alert.priority === 'critical')
  })

  const recentRecommendations = computed(() => {
    return recommendations.value
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
  })

  const methodologiesByCategory = computed(() => {
    const categories = {}
    methodologies.value.forEach(methodology => {
      const category = methodology.category || 'Outros'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(methodology)
    })
    return categories
  })

  const recentAnalyses = computed(() => {
    return analysisHistory.value
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
  })

  // Actions
  const fetchMethodologies = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await analysisAPI.getMethodologies()
      
      if (response.data.success) {
        methodologies.value = response.data.data
        lastUpdate.value = new Date()
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar metodologias')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar metodologias'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const runAnalysis = async (methodologyId, parameters = {}) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await analysisAPI.runAnalysis(methodologyId, parameters)
      
      if (response.data.success) {
        currentAnalysis.value = response.data.data
        
        // Adicionar ao histórico
        analysisHistory.value.unshift({
          id: response.data.data.id,
          methodologyId,
          parameters,
          createdAt: new Date(),
          status: 'completed'
        })
        
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro ao executar análise')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao executar análise'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchRecommendations = async (filters = {}) => {
    try {
      const response = await analysisAPI.getRecommendations(filters)
      
      if (response.data.success) {
        recommendations.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar recomendações')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar recomendações'
      return { success: false, error: error.value }
    }
  }

  const fetchAlerts = async (filters = {}) => {
    try {
      const response = await analysisAPI.getAlerts(filters)
      
      if (response.data.success) {
        alerts.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar alertas')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar alertas'
      return { success: false, error: error.value }
    }
  }

  const markAlertAsRead = async (alertId) => {
    try {
      const response = await analysisAPI.markAlertAsRead(alertId)
      
      if (response.data.success) {
        const alert = alerts.value.find(a => a.id === alertId)
        if (alert) {
          alert.isRead = true
          alert.readAt = new Date()
        }
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao marcar alerta como lido')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao marcar alerta como lido'
      return { success: false, error: error.value }
    }
  }

  const fetchAnalysisHistory = async (filters = {}) => {
    try {
      const response = await analysisAPI.getAnalysisHistory(filters)
      
      if (response.data.success) {
        analysisHistory.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar histórico')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar histórico'
      return { success: false, error: error.value }
    }
  }

  const fetchAssetAnalysis = async (symbol, methodologies = []) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await analysisAPI.getAssetAnalysis(symbol, methodologies)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro ao analisar ativo')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao analisar ativo'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchMarketAnalysis = async () => {
    try {
      const response = await analysisAPI.getMarketAnalysis()
      
      if (response.data.success) {
        marketAnalysis.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar análise de mercado')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar análise de mercado'
      return { success: false, error: error.value }
    }
  }

  const saveAnalysis = async (analysisData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await analysisAPI.saveAnalysis(analysisData)
      
      if (response.data.success) {
        savedAnalyses.value.push(response.data.data)
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro ao salvar análise')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao salvar análise'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchSavedAnalyses = async () => {
    try {
      const response = await analysisAPI.getSavedAnalyses()
      
      if (response.data.success) {
        savedAnalyses.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar análises salvas')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar análises salvas'
      return { success: false, error: error.value }
    }
  }

  const deleteSavedAnalysis = async (analysisId) => {
    try {
      const response = await analysisAPI.deleteSavedAnalysis(analysisId)
      
      if (response.data.success) {
        savedAnalyses.value = savedAnalyses.value.filter(analysis => analysis.id !== analysisId)
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao deletar análise')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao deletar análise'
      return { success: false, error: error.value }
    }
  }

  const compareAssets = async (symbols) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await analysisAPI.compareAssets(symbols)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro ao comparar ativos')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao comparar ativos'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const runPortfolioOptimization = async (optimizationParams) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await analysisAPI.getPortfolioOptimization(optimizationParams)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro na otimização de carteira')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro na otimização de carteira'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const loadAllData = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      await Promise.all([
        fetchMethodologies(),
        fetchRecommendations(),
        fetchAlerts(),
        fetchAnalysisHistory(),
        fetchMarketAnalysis(),
        fetchSavedAnalyses()
      ])
      
      return { success: true }
    } catch (err) {
      error.value = 'Erro ao carregar dados de análise'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearData = () => {
    methodologies.value = []
    recommendations.value = []
    alerts.value = []
    analysisHistory.value = []
    currentAnalysis.value = null
    marketAnalysis.value = null
    savedAnalyses.value = []
    lastUpdate.value = null
  }

  return {
    // State
    methodologies,
    recommendations,
    alerts,
    analysisHistory,
    currentAnalysis,
    marketAnalysis,
    savedAnalyses,
    isLoading,
    error,
    lastUpdate,
    
    // Getters
    activeAlerts,
    criticalAlerts,
    recentRecommendations,
    methodologiesByCategory,
    recentAnalyses,
    
    // Actions
    fetchMethodologies,
    runAnalysis,
    fetchRecommendations,
    fetchAlerts,
    markAlertAsRead,
    fetchAnalysisHistory,
    fetchAssetAnalysis,
    fetchMarketAnalysis,
    saveAnalysis,
    fetchSavedAnalyses,
    deleteSavedAnalysis,
    compareAssets,
    runPortfolioOptimization,
    loadAllData,
    clearError,
    clearData
  }
})

