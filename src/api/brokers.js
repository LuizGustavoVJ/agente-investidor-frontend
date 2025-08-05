import client from './client'

export const brokersAPI = {
  // Obter lista de corretoras disponíveis
  getAvailableBrokers: () => {
    return client.get('/brokers/available')
  },

  // Obter corretoras conectadas do usuário
  getConnectedBrokers: () => {
    return client.get('/brokers/connected')
  },

  // Conectar nova corretora
  connectBroker: (brokerData) => {
    return client.post('/brokers/connect', {
      brokerId: brokerData.brokerId,
      credentials: brokerData.credentials,
      accountType: brokerData.accountType
    })
  },

  // Desconectar corretora
  disconnectBroker: (connectionId) => {
    return client.delete(`/brokers/disconnect/${connectionId}`)
  },

  // Testar conexão com corretora
  testConnection: (connectionId) => {
    return client.post(`/brokers/test/${connectionId}`)
  },

  // Sincronizar dados de uma corretora específica
  syncBroker: (connectionId) => {
    return client.post(`/brokers/sync/${connectionId}`)
  },

  // Sincronizar todas as corretoras
  syncAllBrokers: () => {
    return client.post('/brokers/sync/all')
  },

  // Obter status de sincronização
  getSyncStatus: (connectionId = null) => {
    const url = connectionId ? `/brokers/sync/status/${connectionId}` : '/brokers/sync/status'
    return client.get(url)
  },

  // Obter histórico de sincronizações
  getSyncHistory: (connectionId, filters = {}) => {
    return client.get(`/brokers/sync/history/${connectionId}`, {
      params: filters
    })
  },

  // Obter posições de uma corretora
  getBrokerPositions: (connectionId) => {
    return client.get(`/brokers/positions/${connectionId}`)
  },

  // Obter transações de uma corretora
  getBrokerTransactions: (connectionId, filters = {}) => {
    return client.get(`/brokers/transactions/${connectionId}`, {
      params: filters
    })
  },

  // Obter saldo de uma corretora
  getBrokerBalance: (connectionId) => {
    return client.get(`/brokers/balance/${connectionId}`)
  },

  // Obter extrato de uma corretora
  getBrokerStatement: (connectionId, period) => {
    return client.get(`/brokers/statement/${connectionId}`, {
      params: { period }
    })
  },

  // Configurar sincronização automática
  configureAutoSync: (connectionId, config) => {
    return client.put(`/brokers/auto-sync/${connectionId}`, config)
  },

  // Obter configurações de sincronização
  getSyncConfiguration: (connectionId) => {
    return client.get(`/brokers/auto-sync/${connectionId}`)
  },

  // Obter taxas e custos da corretora
  getBrokerFees: (connectionId) => {
    return client.get(`/brokers/fees/${connectionId}`)
  },

  // Obter informações da conta na corretora
  getAccountInfo: (connectionId) => {
    return client.get(`/brokers/account/${connectionId}`)
  },

  // Atualizar credenciais da corretora
  updateCredentials: (connectionId, credentials) => {
    return client.put(`/brokers/credentials/${connectionId}`, credentials)
  },

  // Obter logs de conexão
  getConnectionLogs: (connectionId, filters = {}) => {
    return client.get(`/brokers/logs/${connectionId}`, {
      params: filters
    })
  },

  // Resolver conflitos de dados
  resolveDataConflict: (conflictId, resolution) => {
    return client.post(`/brokers/conflicts/${conflictId}/resolve`, resolution)
  },

  // Obter conflitos pendentes
  getPendingConflicts: () => {
    return client.get('/brokers/conflicts/pending')
  },

  // Mapear ativos entre corretoras
  mapAssets: (mappingData) => {
    return client.post('/brokers/assets/map', mappingData)
  },

  // Obter mapeamento de ativos
  getAssetMapping: () => {
    return client.get('/brokers/assets/mapping')
  },

  // Validar dados importados
  validateImportedData: (connectionId, validationRules) => {
    return client.post(`/brokers/validate/${connectionId}`, validationRules)
  },

  // Obter relatório de importação
  getImportReport: (importId) => {
    return client.get(`/brokers/import/report/${importId}`)
  },

  // Exportar dados para corretora (se suportado)
  exportToBroker: (connectionId, exportData) => {
    return client.post(`/brokers/export/${connectionId}`, exportData)
  },

  // Obter capacidades da corretora
  getBrokerCapabilities: (brokerId) => {
    return client.get(`/brokers/capabilities/${brokerId}`)
  },

  // Configurar notificações da corretora
  configureBrokerNotifications: (connectionId, notificationConfig) => {
    return client.put(`/brokers/notifications/${connectionId}`, notificationConfig)
  },

  // Obter configurações de notificações
  getNotificationConfiguration: (connectionId) => {
    return client.get(`/brokers/notifications/${connectionId}`)
  }
}

