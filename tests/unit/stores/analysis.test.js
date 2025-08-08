import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis Store', () => {
  let analysisStore

  beforeEach(() => {
    setActivePinia(createPinia())
    analysisStore = useAnalysisStore()
    vi.clearAllMocks()
  })

  describe('Estado inicial', () => {
    it('deve ter estado inicial correto', () => {
      expect(analysisStore.analysis).toEqual({})
      expect(analysisStore.methodologies).toEqual([])
      expect(analysisStore.recommendations).toEqual([])
      expect(analysisStore.riskAnalysis).toEqual({})
      expect(analysisStore.isLoading).toBe(false)
      expect(analysisStore.error).toBeNull()
    })
  })

  describe('Propriedades básicas', () => {
    it('deve ter propriedades necessárias', () => {
      expect(analysisStore).toHaveProperty('analysis')
      expect(analysisStore).toHaveProperty('methodologies')
      expect(analysisStore).toHaveProperty('recommendations')
      expect(analysisStore).toHaveProperty('riskAnalysis')
      expect(analysisStore).toHaveProperty('isLoading')
      expect(analysisStore).toHaveProperty('error')
    })

    it('deve ter métodos necessários', () => {
      expect(typeof analysisStore.clearError).toBe('function')
    })
  })

  describe('Gerenciamento de análise', () => {
    it('deve permitir definir análise', () => {
      const mockAnalysis = {
        overallScore: 85,
        riskLevel: 'Moderado',
        diversificationScore: 78
      }

      analysisStore.analysis = mockAnalysis
      expect(analysisStore.analysis).toEqual(mockAnalysis)
    })

    it('deve permitir definir metodologias', () => {
      const mockMethodologies = [
        {
          id: 1,
          name: 'Warren Buffett',
          category: 'value',
          enabled: true,
          score: 88
        },
        {
          id: 2,
          name: 'Benjamin Graham',
          category: 'value',
          enabled: false,
          score: 85
        }
      ]

      analysisStore.methodologies = mockMethodologies
      expect(analysisStore.methodologies).toEqual(mockMethodologies)
      expect(analysisStore.methodologies).toHaveLength(2)
    })

    it('deve permitir definir recomendações', () => {
      const mockRecommendations = [
        {
          id: 1,
          type: 'buy',
          asset: 'PETR4',
          priority: 'high',
          status: 'pending'
        },
        {
          id: 2,
          type: 'sell',
          asset: 'VALE3',
          priority: 'medium',
          status: 'pending'
        }
      ]

      analysisStore.recommendations = mockRecommendations
      expect(analysisStore.recommendations).toEqual(mockRecommendations)
      expect(analysisStore.recommendations).toHaveLength(2)
    })

    it('deve permitir definir análise de risco', () => {
      const mockRiskAnalysis = {
        riskProfile: 'Moderado',
        volatility: 15.5,
        sharpeRatio: 1.2,
        alerts: []
      }

      analysisStore.riskAnalysis = mockRiskAnalysis
      expect(analysisStore.riskAnalysis).toEqual(mockRiskAnalysis)
    })
  })

  describe('Manipulação de metodologias', () => {
    it('deve atualizar status de metodologia', () => {
      const methodology = {
        id: 1,
        name: 'Warren Buffett',
        enabled: false
      }

      analysisStore.methodologies = [methodology]

      // Atualizar metodologia
      analysisStore.methodologies[0].enabled = true

      expect(analysisStore.methodologies[0].enabled).toBe(true)
    })

    it('deve filtrar metodologias habilitadas', () => {
      analysisStore.methodologies = [
        { id: 1, name: 'Warren Buffett', enabled: true },
        { id: 2, name: 'Benjamin Graham', enabled: false },
        { id: 3, name: 'Peter Lynch', enabled: true }
      ]

      const enabledMethodologies = analysisStore.methodologies.filter(m => m.enabled)

      expect(enabledMethodologies).toHaveLength(2)
      expect(enabledMethodologies[0].name).toBe('Warren Buffett')
      expect(enabledMethodologies[1].name).toBe('Peter Lynch')
    })
  })

  describe('Manipulação de recomendações', () => {
    it('deve atualizar status de recomendação', () => {
      const recommendation = {
        id: 1,
        status: 'pending'
      }

      analysisStore.recommendations = [recommendation]

      // Aceitar recomendação
      analysisStore.recommendations[0].status = 'accepted'

      expect(analysisStore.recommendations[0].status).toBe('accepted')
    })

    it('deve filtrar recomendações pendentes', () => {
      analysisStore.recommendations = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'accepted' },
        { id: 3, status: 'pending' },
        { id: 4, status: 'dismissed' }
      ]

      const pendingRecommendations = analysisStore.recommendations.filter(r => r.status === 'pending')

      expect(pendingRecommendations).toHaveLength(2)
      expect(pendingRecommendations[0].id).toBe(1)
      expect(pendingRecommendations[1].id).toBe(3)
    })

    it('deve filtrar recomendações por prioridade', () => {
      analysisStore.recommendations = [
        { id: 1, priority: 'high', status: 'pending' },
        { id: 2, priority: 'medium', status: 'pending' },
        { id: 3, priority: 'high', status: 'pending' },
        { id: 4, priority: 'low', status: 'pending' }
      ]

      const highPriorityRecommendations = analysisStore.recommendations.filter(r => r.priority === 'high')

      expect(highPriorityRecommendations).toHaveLength(2)
      expect(highPriorityRecommendations[0].priority).toBe('high')
      expect(highPriorityRecommendations[1].priority).toBe('high')
    })
  })

  describe('Gerenciamento de erro', () => {
    it('deve limpar erro', () => {
      analysisStore.error = 'Algum erro'
      
      analysisStore.clearError()
      
      expect(analysisStore.error).toBeNull()
    })
  })

  describe('Estado de loading', () => {
    it('deve gerenciar estado de loading', () => {
      analysisStore.isLoading = true
      expect(analysisStore.isLoading).toBe(true)
      
      analysisStore.isLoading = false
      expect(analysisStore.isLoading).toBe(false)
    })
  })
})

