import client from './client'

export const analysisAPI = {
  // Obter lista de metodologias disponíveis
  getMethodologies: () => {
    return client.get('/methodology/list')
  },

  // Executar análise com metodologia específica
  runAnalysis: (methodologyId, parameters = {}) => {
    return client.post('/methodology/analyze', {
      methodology: methodologyId,
      parameters
    })
  },

  // Obter resultados de análise
  getAnalysisResults: (analysisId) => {
    return client.get(`/methodology/results/${analysisId}`)
  },

  // Obter recomendações gerais
  getRecommendations: (filters = {}) => {
    return client.get('/methodology/recommendations', {
      params: filters
    })
  },

  // Obter análise de portfolio completa
  getPortfolioAnalysis: (portfolioData) => {
    return client.post('/analysis/portfolio', portfolioData)
  },

  // Obter alertas ativos
  getAlerts: (filters = {}) => {
    return client.get('/analysis/alerts', {
      params: filters
    })
  },

  // Marcar alerta como lido
  markAlertAsRead: (alertId) => {
    return client.put(`/analysis/alerts/${alertId}/read`)
  },

  // Executar análise customizada
  runCustomAnalysis: (analysisConfig) => {
    return client.post('/analysis/custom', analysisConfig)
  },

  // Obter histórico de análises
  getAnalysisHistory: (filters = {}) => {
    return client.get('/analysis/history', {
      params: filters
    })
  },

  // Obter análise de ativo específico
  getAssetAnalysis: (symbol, methodologies = []) => {
    return client.get(`/analysis/asset/${symbol}`, {
      params: { methodologies: methodologies.join(',') }
    })
  },

  // Obter análise de setor
  getSectorAnalysis: (sector) => {
    return client.get(`/analysis/sector/${sector}`)
  },

  // Obter análise de mercado
  getMarketAnalysis: () => {
    return client.get('/analysis/market')
  },

  // Obter indicadores técnicos
  getTechnicalIndicators: (symbol, indicators = []) => {
    return client.get(`/analysis/technical/${symbol}`, {
      params: { indicators: indicators.join(',') }
    })
  },

  // Obter análise fundamentalista
  getFundamentalAnalysis: (symbol) => {
    return client.get(`/analysis/fundamental/${symbol}`)
  },

  // Obter score de investimento
  getInvestmentScore: (symbol) => {
    return client.get(`/analysis/score/${symbol}`)
  },

  // Comparar ativos
  compareAssets: (symbols) => {
    return client.post('/analysis/compare', {
      symbols
    })
  },

  // Obter simulação de cenários
  getScenarioSimulation: (scenarioData) => {
    return client.post('/analysis/scenario', scenarioData)
  },

  // Obter análise de risco/retorno
  getRiskReturnAnalysis: (portfolioData) => {
    return client.post('/analysis/risk-return', portfolioData)
  },

  // Obter otimização de carteira
  getPortfolioOptimization: (optimizationParams) => {
    return client.post('/analysis/optimize', optimizationParams)
  },

  // Obter backtesting de estratégia
  getBacktesting: (strategyData) => {
    return client.post('/analysis/backtest', strategyData)
  },

  // Salvar análise favorita
  saveAnalysis: (analysisData) => {
    return client.post('/analysis/save', analysisData)
  },

  // Obter análises salvas
  getSavedAnalyses: () => {
    return client.get('/analysis/saved')
  },

  // Deletar análise salva
  deleteSavedAnalysis: (analysisId) => {
    return client.delete(`/analysis/saved/${analysisId}`)
  },

  // Compartilhar análise
  shareAnalysis: (analysisId, shareData) => {
    return client.post(`/analysis/share/${analysisId}`, shareData)
  },

  // Obter análise compartilhada
  getSharedAnalysis: (shareToken) => {
    return client.get(`/analysis/shared/${shareToken}`)
  },

  // Configurar alertas automáticos
  configureAlerts: (alertConfig) => {
    return client.post('/analysis/alerts/configure', alertConfig)
  },

  // Obter configurações de alertas
  getAlertConfigurations: () => {
    return client.get('/analysis/alerts/configurations')
  },

  // Atualizar configuração de alerta
  updateAlertConfiguration: (configId, configData) => {
    return client.put(`/analysis/alerts/configurations/${configId}`, configData)
  },

  // Deletar configuração de alerta
  deleteAlertConfiguration: (configId) => {
    return client.delete(`/analysis/alerts/configurations/${configId}`)
  }
}

