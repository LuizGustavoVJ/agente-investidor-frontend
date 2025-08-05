import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { brokersAPI } from '@/api/brokers'

export const useBrokersStore = defineStore('brokers', () => {
  // State
  const availableBrokers = ref([])
  const connectedBrokers = ref([])
  const syncStatus = ref({})
  const syncHistory = ref([])
  const pendingConflicts = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastSync = ref(null)

  // Getters
  const activeBrokers = computed(() => {
    return connectedBrokers.value.filter(broker => broker.status === 'active')
  })

  const inactiveBrokers = computed(() => {
    return connectedBrokers.value.filter(broker => broker.status !== 'active')
  })

  const brokersWithErrors = computed(() => {
    return connectedBrokers.value.filter(broker => broker.hasErrors)
  })

  const totalConnectedBrokers = computed(() => {
    return connectedBrokers.value.length
  })

  const isSyncing = computed(() => {
    return Object.values(syncStatus.value).some(status => status.isRunning)
  })

  const lastSyncDate = computed(() => {
    if (!lastSync.value) return null
    return new Date(lastSync.value)
  })

  const hasPendingConflicts = computed(() => {
    return pendingConflicts.value.length > 0
  })

  // Actions
  const fetchAvailableBrokers = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await brokersAPI.getAvailableBrokers()
      
      if (response.data.success) {
        availableBrokers.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar corretoras disponíveis')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar corretoras disponíveis'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchConnectedBrokers = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await brokersAPI.getConnectedBrokers()
      
      if (response.data.success) {
        connectedBrokers.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar corretoras conectadas')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar corretoras conectadas'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const connectBroker = async (brokerData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await brokersAPI.connectBroker(brokerData)
      
      if (response.data.success) {
        connectedBrokers.value.push(response.data.data)
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro ao conectar corretora')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao conectar corretora'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const disconnectBroker = async (connectionId) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await brokersAPI.disconnectBroker(connectionId)
      
      if (response.data.success) {
        connectedBrokers.value = connectedBrokers.value.filter(
          broker => broker.connectionId !== connectionId
        )
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao desconectar corretora')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao desconectar corretora'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const testConnection = async (connectionId) => {
    try {
      const response = await brokersAPI.testConnection(connectionId)
      
      if (response.data.success) {
        // Atualizar status da conexão
        const broker = connectedBrokers.value.find(b => b.connectionId === connectionId)
        if (broker) {
          broker.connectionStatus = response.data.data.status
          broker.lastTest = new Date()
        }
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro ao testar conexão')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao testar conexão'
      return { success: false, error: error.value }
    }
  }

  const syncBroker = async (connectionId) => {
    try {
      // Marcar como sincronizando
      if (!syncStatus.value[connectionId]) {
        syncStatus.value[connectionId] = {}
      }
      syncStatus.value[connectionId].isRunning = true
      syncStatus.value[connectionId].startTime = new Date()
      
      const response = await brokersAPI.syncBroker(connectionId)
      
      if (response.data.success) {
        syncStatus.value[connectionId].isRunning = false
        syncStatus.value[connectionId].lastSync = new Date()
        syncStatus.value[connectionId].status = 'success'
        lastSync.value = new Date()
        
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro na sincronização')
      }
    } catch (err) {
      if (syncStatus.value[connectionId]) {
        syncStatus.value[connectionId].isRunning = false
        syncStatus.value[connectionId].status = 'error'
        syncStatus.value[connectionId].error = err.message
      }
      
      error.value = err.response?.data?.message || err.message || 'Erro na sincronização'
      return { success: false, error: error.value }
    }
  }

  const syncAllBrokers = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await brokersAPI.syncAllBrokers()
      
      if (response.data.success) {
        // Atualizar status de todas as corretoras
        activeBrokers.value.forEach(broker => {
          if (!syncStatus.value[broker.connectionId]) {
            syncStatus.value[broker.connectionId] = {}
          }
          syncStatus.value[broker.connectionId].isRunning = true
          syncStatus.value[broker.connectionId].startTime = new Date()
        })
        
        lastSync.value = new Date()
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || 'Erro na sincronização geral')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro na sincronização geral'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchSyncStatus = async (connectionId = null) => {
    try {
      const response = await brokersAPI.getSyncStatus(connectionId)
      
      if (response.data.success) {
        if (connectionId) {
          syncStatus.value[connectionId] = response.data.data
        } else {
          syncStatus.value = response.data.data
        }
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar status de sincronização')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar status de sincronização'
      return { success: false, error: error.value }
    }
  }

  const fetchSyncHistory = async (connectionId, filters = {}) => {
    try {
      const response = await brokersAPI.getSyncHistory(connectionId, filters)
      
      if (response.data.success) {
        syncHistory.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar histórico de sincronização')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar histórico de sincronização'
      return { success: false, error: error.value }
    }
  }

  const fetchPendingConflicts = async () => {
    try {
      const response = await brokersAPI.getPendingConflicts()
      
      if (response.data.success) {
        pendingConflicts.value = response.data.data
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar conflitos pendentes')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao carregar conflitos pendentes'
      return { success: false, error: error.value }
    }
  }

  const resolveConflict = async (conflictId, resolution) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await brokersAPI.resolveDataConflict(conflictId, resolution)
      
      if (response.data.success) {
        pendingConflicts.value = pendingConflicts.value.filter(
          conflict => conflict.id !== conflictId
        )
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao resolver conflito')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao resolver conflito'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const updateCredentials = async (connectionId, credentials) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await brokersAPI.updateCredentials(connectionId, credentials)
      
      if (response.data.success) {
        const broker = connectedBrokers.value.find(b => b.connectionId === connectionId)
        if (broker) {
          broker.lastCredentialUpdate = new Date()
          broker.credentialStatus = 'valid'
        }
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar credenciais')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erro ao atualizar credenciais'
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
        fetchAvailableBrokers(),
        fetchConnectedBrokers(),
        fetchSyncStatus(),
        fetchPendingConflicts()
      ])
      
      return { success: true }
    } catch (err) {
      error.value = 'Erro ao carregar dados das corretoras'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearData = () => {
    availableBrokers.value = []
    connectedBrokers.value = []
    syncStatus.value = {}
    syncHistory.value = []
    pendingConflicts.value = []
    lastSync.value = null
  }

  return {
    // State
    availableBrokers,
    connectedBrokers,
    syncStatus,
    syncHistory,
    pendingConflicts,
    isLoading,
    error,
    lastSync,
    
    // Getters
    activeBrokers,
    inactiveBrokers,
    brokersWithErrors,
    totalConnectedBrokers,
    isSyncing,
    lastSyncDate,
    hasPendingConflicts,
    
    // Actions
    fetchAvailableBrokers,
    fetchConnectedBrokers,
    connectBroker,
    disconnectBroker,
    testConnection,
    syncBroker,
    syncAllBrokers,
    fetchSyncStatus,
    fetchSyncHistory,
    fetchPendingConflicts,
    resolveConflict,
    updateCredentials,
    loadAllData,
    clearError,
    clearData
  }
})

