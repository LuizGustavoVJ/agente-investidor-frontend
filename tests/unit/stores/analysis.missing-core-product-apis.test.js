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
    getFundamentalAnalysis: vi.fn(),
    getTechnicalIndicators: vi.fn(),
    getInvestmentScore: vi.fn(),
    getSectorAnalysis: vi.fn(),
    getScenarioSimulation: vi.fn(),
    getRiskReturnAnalysis: vi.fn(),
    runCustomAnalysis: vi.fn(),
    getAnalysisResults: vi.fn()
  }
}))

describe('Analysis — fundamental, técnico, score e cenário existem na API e somem na store', () => {
  let analysisStore

  beforeEach(() => {
    setActivePinia(createPinia())
    analysisStore = useAnalysisStore()
    vi.clearAllMocks()
    analysisStore.currentAnalysis = null
    analysisStore.methodologies = [{ id: 'rsi', name: 'RSI' }]
    analysisStore.marketAnalysis = { ibov: 1.2 }
  })

  it('store não expõe fundamental, indicadores, score nem setor — currentAnalysis permanece null', () => {
    expect(typeof analysisAPI.getFundamentalAnalysis).toBe('function')
    expect(typeof analysisAPI.getTechnicalIndicators).toBe('function')
    expect(typeof analysisAPI.getInvestmentScore).toBe('function')
    expect(typeof analysisAPI.getSectorAnalysis).toBe('function')

    expect(analysisStore.getFundamentalAnalysis).toBeUndefined()
    expect(analysisStore.fetchFundamentalAnalysis).toBeUndefined()
    expect(analysisStore.getTechnicalIndicators).toBeUndefined()
    expect(analysisStore.fetchTechnicalIndicators).toBeUndefined()
    expect(analysisStore.getInvestmentScore).toBeUndefined()
    expect(analysisStore.fetchInvestmentScore).toBeUndefined()
    expect(analysisStore.getSectorAnalysis).toBeUndefined()
    expect(analysisStore.fetchSectorAnalysis).toBeUndefined()
    expect(analysisStore.currentAnalysis).toBeNull()
    expect(analysisStore.marketAnalysis).toEqual({ ibov: 1.2 })
  })

  it('store não expõe cenário, risco/retorno, análise custom nem getAnalysisResults', () => {
    expect(typeof analysisAPI.getScenarioSimulation).toBe('function')
    expect(typeof analysisAPI.getRiskReturnAnalysis).toBe('function')
    expect(typeof analysisAPI.runCustomAnalysis).toBe('function')
    expect(typeof analysisAPI.getAnalysisResults).toBe('function')

    expect(analysisStore.getScenarioSimulation).toBeUndefined()
    expect(analysisStore.getRiskReturnAnalysis).toBeUndefined()
    expect(analysisStore.runCustomAnalysis).toBeUndefined()
    expect(analysisStore.getAnalysisResults).toBeUndefined()
    expect(analysisStore.fetchAnalysisResults).toBeUndefined()
    expect(analysisStore.currentAnalysis).toBeNull()
    expect(analysisStore.methodologies).toEqual([{ id: 'rsi', name: 'RSI' }])
  })
})
