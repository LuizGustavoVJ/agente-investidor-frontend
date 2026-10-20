import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'

describe('clearData — zera coleções e deixa error/isLoading', () => {
  let brokersStore
  let portfolioStore
  let analysisStore

  beforeEach(() => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
  })

  it('brokers.clearData esvazia corretoras e histórico, mas error e isLoading permanecem', () => {
    brokersStore.availableBrokers = [{ id: 'xp', name: 'XP' }]
    brokersStore.connectedBrokers = [{ id: 'xp', name: 'XP', status: 'error', hasErrors: true }]
    brokersStore.syncStatus = { xp: { isRunning: true } }
    brokersStore.syncHistory = [{ id: 1, broker: 'xp' }]
    brokersStore.pendingConflicts = [{ id: 'c1' }]
    brokersStore.lastSync = '2026-10-01T10:00:00.000Z'
    brokersStore.error = 'timeout na XP'
    brokersStore.isLoading = true

    brokersStore.clearData()

    expect(brokersStore.availableBrokers).toEqual([])
    expect(brokersStore.connectedBrokers).toEqual([])
    expect(brokersStore.syncStatus).toEqual({})
    expect(brokersStore.syncHistory).toEqual([])
    expect(brokersStore.pendingConflicts).toEqual([])
    expect(brokersStore.lastSync).toBeNull()
    expect(brokersStore.activeBrokers).toEqual([])
    expect(brokersStore.isSyncing).toBe(false)
    expect(brokersStore.error).toBe('timeout na XP')
    expect(brokersStore.isLoading).toBe(true)
  })

  it('portfolio.clearData zera patrimônio e metas, mas o erro e o spinner ficam', () => {
    portfolioStore.summary = { totalValue: 50000 }
    portfolioStore.allocation = { byType: { stocks: { percentage: 80 } } }
    portfolioStore.evolution = [{ date: '2026-01-01', value: 40000 }]
    portfolioStore.assets = [{ symbol: 'PETR4', currentValue: 12000 }]
    portfolioStore.transactions = [{ id: 1, asset: 'PETR4' }]
    portfolioStore.dividends = [{ id: 1, asset: 'ITUB4' }]
    portfolioStore.goals = [{ id: 1, title: 'Reserva', status: 'active' }]
    portfolioStore.performance = { ytd: 0.12 }
    portfolioStore.riskAnalysis = { var: 0.08 }
    portfolioStore.lastUpdate = new Date('2026-10-19T10:00:00.000Z')
    portfolioStore.error = 'falha ao carregar resumo'
    portfolioStore.isLoading = true

    portfolioStore.clearData()

    expect(portfolioStore.summary).toBeNull()
    expect(portfolioStore.allocation).toBeNull()
    expect(portfolioStore.evolution).toBeNull()
    expect(portfolioStore.assets).toEqual([])
    expect(portfolioStore.transactions).toEqual([])
    expect(portfolioStore.dividends).toEqual([])
    expect(portfolioStore.goals).toEqual([])
    expect(portfolioStore.performance).toBeNull()
    expect(portfolioStore.riskAnalysis).toBeNull()
    expect(portfolioStore.lastUpdate).toBeNull()
    expect(portfolioStore.totalValue).toBe(0)
    expect(portfolioStore.activeGoals).toEqual([])
    expect(portfolioStore.error).toBe('falha ao carregar resumo')
    expect(portfolioStore.isLoading).toBe(true)
  })

  it('analysis.clearData limpa recomendações e histórico, mas error e isLoading permanecem', () => {
    analysisStore.methodologies = [{ id: 1, name: 'Value' }]
    analysisStore.recommendations = [{ id: 9, asset: 'VALE3', status: 'pending' }]
    analysisStore.alerts = [{ id: 2, isRead: false, status: 'active', priority: 'critical' }]
    analysisStore.analysisHistory = [{ id: 3, createdAt: '2026-10-01' }]
    analysisStore.currentAnalysis = { id: 4, title: 'PETR4' }
    analysisStore.marketAnalysis = { ibov: 1.2 }
    analysisStore.savedAnalyses = [{ id: 5, title: 'Growth' }]
    analysisStore.lastUpdate = new Date('2026-10-19T09:00:00.000Z')
    analysisStore.error = 'API de análise indisponível'
    analysisStore.isLoading = true

    analysisStore.clearData()

    expect(analysisStore.methodologies).toEqual([])
    expect(analysisStore.recommendations).toEqual([])
    expect(analysisStore.alerts).toEqual([])
    expect(analysisStore.analysisHistory).toEqual([])
    expect(analysisStore.currentAnalysis).toBeNull()
    expect(analysisStore.marketAnalysis).toBeNull()
    expect(analysisStore.savedAnalyses).toEqual([])
    expect(analysisStore.lastUpdate).toBeNull()
    expect(analysisStore.activeAlerts).toEqual([])
    expect(analysisStore.criticalAlerts).toEqual([])
    expect(analysisStore.error).toBe('API de análise indisponível')
    expect(analysisStore.isLoading).toBe(true)
  })
})
