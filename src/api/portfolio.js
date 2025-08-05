import client from './client'

export const portfolioAPI = {
  // Obter resumo do portfolio
  getSummary: () => {
    return client.get('/portfolio/summary')
  },

  // Obter alocação de ativos
  getAllocation: () => {
    return client.get('/portfolio/allocation')
  },

  // Obter evolução do patrimônio
  getEvolution: (period = '1Y') => {
    return client.get('/portfolio/evolution', {
      params: { period }
    })
  },

  // Obter lista de ativos
  getAssets: (filters = {}) => {
    return client.get('/portfolio/assets', {
      params: filters
    })
  },

  // Obter detalhes de um ativo específico
  getAssetDetails: (symbol) => {
    return client.get(`/portfolio/assets/${symbol}`)
  },

  // Obter transações
  getTransactions: (filters = {}) => {
    return client.get('/portfolio/transactions', {
      params: filters
    })
  },

  // Adicionar transação manual
  addTransaction: (transactionData) => {
    return client.post('/portfolio/transactions', transactionData)
  },

  // Atualizar transação
  updateTransaction: (transactionId, transactionData) => {
    return client.put(`/portfolio/transactions/${transactionId}`, transactionData)
  },

  // Deletar transação
  deleteTransaction: (transactionId) => {
    return client.delete(`/portfolio/transactions/${transactionId}`)
  },

  // Obter dividendos recebidos
  getDividends: (filters = {}) => {
    return client.get('/portfolio/dividends', {
      params: filters
    })
  },

  // Obter metas de investimento
  getGoals: () => {
    return client.get('/portfolio/goals')
  },

  // Criar nova meta
  createGoal: (goalData) => {
    return client.post('/portfolio/goals', goalData)
  },

  // Atualizar meta
  updateGoal: (goalId, goalData) => {
    return client.put(`/portfolio/goals/${goalId}`, goalData)
  },

  // Deletar meta
  deleteGoal: (goalId) => {
    return client.delete(`/portfolio/goals/${goalId}`)
  },

  // Obter performance por período
  getPerformance: (period = '1Y') => {
    return client.get('/portfolio/performance', {
      params: { period }
    })
  },

  // Obter comparação com benchmarks
  getBenchmarkComparison: (benchmarks = ['IBOV', 'CDI']) => {
    return client.get('/portfolio/benchmark', {
      params: { benchmarks: benchmarks.join(',') }
    })
  },

  // Obter análise de risco
  getRiskAnalysis: () => {
    return client.get('/portfolio/risk')
  },

  // Obter sugestões de rebalanceamento
  getRebalanceSuggestions: () => {
    return client.get('/portfolio/rebalance')
  },

  // Aplicar rebalanceamento
  applyRebalance: (rebalanceData) => {
    return client.post('/portfolio/rebalance', rebalanceData)
  },

  // Obter relatório consolidado
  getConsolidatedReport: (format = 'json') => {
    return client.get('/portfolio/report', {
      params: { format },
      responseType: format === 'pdf' ? 'blob' : 'json'
    })
  },

  // Exportar dados do portfolio
  exportData: (format = 'excel') => {
    return client.get('/portfolio/export', {
      params: { format },
      responseType: 'blob'
    })
  },

  // Sincronizar com corretoras
  syncBrokers: () => {
    return client.post('/portfolio/sync')
  },

  // Obter status de sincronização
  getSyncStatus: () => {
    return client.get('/portfolio/sync/status')
  }
}

