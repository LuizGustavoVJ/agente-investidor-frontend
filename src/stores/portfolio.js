import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { portfolioAPI } from '@/api/portfolio'

export const usePortfolioStore = defineStore('portfolio', () => {
  // State
  const summary = ref(null)
  const allocation = ref(null)
  const evolution = ref(null)
  const assets = ref([])
  const transactions = ref([])
  const dividends = ref([])
  const goals = ref([])
  const performance = ref(null)
  const riskAnalysis = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const lastUpdate = ref(null)

  // Getters
  const totalValue = computed(() => summary.value?.totalValue || 0)
  const totalGain = computed(() => summary.value?.totalGain || 0)
  const totalGainPercent = computed(() => summary.value?.totalGainPercent || 0)
  const totalInvested = computed(() => summary.value?.totalInvested || 0)
  
  const assetsByType = computed(() => {
    if (!allocation.value) return {}
    return allocation.value.byType || {}
  })
  
  const topAssets = computed(() => {
    return assets.value
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 10)
  })
  
  const recentTransactions = computed(() => {
    return transactions.value
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
  })

  const activeGoals = computed(() => {
    return goals.value.filter(goal => goal.status === 'active')
  })

  const completedGoals = computed(() => {
    return goals.value.filter(goal => goal.status === 'completed')
  })

  // Actions
  const fetchSummary = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await portfolioAPI.getSummary()
      
      if (response.data.success) {
        summary.value = response.data.data
        lastUpdate.value = new Date()
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar resumo')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar resumo'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchAllocation = async () => {
    try {
      const response = await portfolioAPI.getAllocation()
      
      if (response.data.success) {
        allocation.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar alocação')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar alocação'
      return { success: false, error: error.value }
    }
  }

  const fetchEvolution = async (period = '1Y') => {
    try {
      const response = await portfolioAPI.getEvolution(period)
      
      if (response.data.success) {
        evolution.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar evolução')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar evolução'
      return { success: false, error: error.value }
    }
  }

  const fetchAssets = async (filters = {}) => {
    try {
      const response = await portfolioAPI.getAssets(filters)
      
      if (response.data.success) {
        assets.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar ativos')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar ativos'
      return { success: false, error: error.value }
    }
  }

  const fetchTransactions = async (filters = {}) => {
    try {
      const response = await portfolioAPI.getTransactions(filters)
      
      if (response.data.success) {
        transactions.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar transações')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar transações'
      return { success: false, error: error.value }
    }
  }

  const fetchGoals = async () => {
    try {
      const response = await portfolioAPI.getGoals()
      
      if (response.data.success) {
        goals.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar metas')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar metas'
      return { success: false, error: error.value }
    }
  }

  const createGoal = async (goalData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await portfolioAPI.createGoal(goalData)
      
      if (response.data.success) {
        goals.value.push(response.data.data)
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro ao criar meta')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao criar meta'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const updateGoal = async (goalId, goalData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await portfolioAPI.updateGoal(goalId, goalData)
      
      if (response.data.success) {
        const index = goals.value.findIndex(goal => goal.id === goalId)
        if (index !== -1) {
          goals.value[index] = response.data.data
        }
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar meta')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao atualizar meta'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const deleteGoal = async (goalId) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await portfolioAPI.deleteGoal(goalId)
      
      if (response.data.success) {
        goals.value = goals.value.filter(goal => goal.id !== goalId)
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao deletar meta')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao deletar meta'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchPerformance = async (period = '1Y') => {
    try {
      const response = await portfolioAPI.getPerformance(period)
      
      if (response.data.success) {
        performance.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar performance')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar performance'
      return { success: false, error: error.value }
    }
  }

  const fetchRiskAnalysis = async () => {
    try {
      const response = await portfolioAPI.getRiskAnalysis()
      
      if (response.data.success) {
        riskAnalysis.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar análise de risco')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar análise de risco'
      return { success: false, error: error.value }
    }
  }

  const syncBrokers = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await portfolioAPI.syncBrokers()
      
      if (response.data.success) {
        // Recarregar dados após sincronização
        await Promise.all([
          fetchSummary(),
          fetchAllocation(),
          fetchAssets(),
          fetchTransactions()
        ])
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro na sincronização')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro na sincronização'
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
        fetchSummary(),
        fetchAllocation(),
        fetchEvolution(),
        fetchAssets(),
        fetchTransactions(),
        fetchGoals(),
        fetchPerformance()
      ])
      
      return { success: true }
    } catch (err) {
      error.value = 'Erro ao carregar dados do portfolio'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearData = () => {
    summary.value = null
    allocation.value = null
    evolution.value = null
    assets.value = []
    transactions.value = []
    dividends.value = []
    goals.value = []
    performance.value = null
    riskAnalysis.value = null
    lastUpdate.value = null
  }

  return {
    // State
    summary,
    allocation,
    evolution,
    assets,
    transactions,
    dividends,
    goals,
    performance,
    riskAnalysis,
    isLoading,
    error,
    lastUpdate,
    
    // Getters
    totalValue,
    totalGain,
    totalGainPercent,
    totalInvested,
    assetsByType,
    topAssets,
    recentTransactions,
    activeGoals,
    completedGoals,
    
    // Actions
    fetchSummary,
    fetchAllocation,
    fetchEvolution,
    fetchAssets,
    fetchTransactions,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    fetchPerformance,
    fetchRiskAnalysis,
    syncBrokers,
    loadAllData,
    clearError,
    clearData
  }
})

