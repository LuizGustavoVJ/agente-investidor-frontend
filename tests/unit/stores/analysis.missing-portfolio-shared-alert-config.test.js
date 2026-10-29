import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'
import { analysisAPI } from '@/api/analysis'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn(),
    getRecommendations: vi.fn(),
    getAlerts: vi.fn(),
    getAnalysisHistory: vi.fn(),
    getMarketAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn(),
    getPortfolioAnalysis: vi.fn(),
    getSharedAnalysis: vi.fn(),
    updateAlertConfiguration: vi.fn(),
    deleteAlertConfiguration: vi.fn()
  }
}))

const ok = (data = []) => ({ data: { success: true, data } })

const dashboardSource = readFileSync(
  resolve(__dirname, '../../../src/components/Dashboard.vue'),
  'utf8'
)
const routerSource = readFileSync(
  resolve(__dirname, '../../../src/router/index.js'),
  'utf8'
)
const storeSource = readFileSync(
  resolve(__dirname, '../../../src/stores/analysis.js'),
  'utf8'
)

describe('Analysis — análise de portfólio, share inbound e mutação de alerta existem na API e somem na store', () => {
  let analysisStore

  beforeEach(() => {
    setActivePinia(createPinia())
    analysisStore = useAnalysisStore()
    vi.clearAllMocks()
    analysisStore.currentAnalysis = null
    analysisStore.alerts = [
      { id: 'critico-1', priority: 'critical', isRead: false, status: 'active' }
    ]
  })

  it('store não expõe getPortfolioAnalysis — loadAllData não hidrata currentAnalysis', async () => {
    expect(typeof analysisAPI.getPortfolioAnalysis).toBe('function')
    expect(analysisStore.getPortfolioAnalysis).toBeUndefined()
    expect(analysisStore.fetchPortfolioAnalysis).toBeUndefined()
    expect(storeSource).not.toMatch(/getPortfolioAnalysis/)
    expect(dashboardSource).not.toMatch(/getPortfolioAnalysis|fetchPortfolioAnalysis/)

    analysisAPI.getMethodologies.mockResolvedValue(ok([{ id: 'rsi', name: 'RSI' }]))
    analysisAPI.getRecommendations.mockResolvedValue(ok([]))
    analysisAPI.getAlerts.mockResolvedValue(ok([]))
    analysisAPI.getAnalysisHistory.mockResolvedValue(ok([]))
    analysisAPI.getMarketAnalysis.mockResolvedValue(ok({ ibov: 1.2 }))
    analysisAPI.getSavedAnalyses.mockResolvedValue(ok([]))

    const result = await analysisStore.loadAllData()

    expect(result).toEqual({ success: true })
    expect(analysisAPI.getPortfolioAnalysis).not.toHaveBeenCalled()
    expect(analysisStore.currentAnalysis).toBeNull()
    expect(analysisStore.methodologies).toEqual([{ id: 'rsi', name: 'RSI' }])
  })

  it('store não expõe getSharedAnalysis e o router não tem rota de token compartilhado', () => {
    expect(typeof analysisAPI.getSharedAnalysis).toBe('function')
    expect(analysisStore.getSharedAnalysis).toBeUndefined()
    expect(analysisStore.fetchSharedAnalysis).toBeUndefined()
    expect(storeSource).not.toMatch(/getSharedAnalysis/)
    expect(routerSource).toMatch(/name: 'Analises'/)
    expect(routerSource).not.toMatch(/getSharedAnalysis/)
    expect(routerSource).not.toMatch(/\/analises\/shared/)
  })

  it('store não expõe update/delete de configuração de alerta — alerta crítico local permanece', () => {
    expect(typeof analysisAPI.updateAlertConfiguration).toBe('function')
    expect(typeof analysisAPI.deleteAlertConfiguration).toBe('function')
    expect(analysisStore.updateAlertConfiguration).toBeUndefined()
    expect(analysisStore.deleteAlertConfiguration).toBeUndefined()
    expect(analysisStore.fetchAlertConfigurations).toBeUndefined()
    expect(analysisStore.criticalAlerts).toHaveLength(1)
    expect(analysisStore.criticalAlerts[0].id).toBe('critico-1')
  })
})
