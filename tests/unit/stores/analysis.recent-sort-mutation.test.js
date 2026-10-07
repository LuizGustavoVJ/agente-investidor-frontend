import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis store — getters recentes mutam as listas canônicas', () => {
  let analysisStore

  beforeEach(() => {
    setActivePinia(createPinia())
    analysisStore = useAnalysisStore()
  })

  it('recentRecommendations faz sort in-place em recommendations', () => {
    analysisStore.recommendations = [
      { id: 1, createdAt: '2024-01-01', asset: 'PETR4' },
      { id: 2, createdAt: '2026-09-01', asset: 'VALE3' },
      { id: 3, createdAt: '2025-06-15', asset: 'ITUB4' }
    ]

    expect(analysisStore.recommendations.map((item) => item.id)).toEqual([1, 2, 3])

    const recent = analysisStore.recentRecommendations

    expect(recent[0].id).toBe(2)
    expect(analysisStore.recommendations.map((item) => item.id)).toEqual([2, 3, 1])
  })

  it('recentAnalyses faz sort in-place em analysisHistory', () => {
    analysisStore.analysisHistory = [
      { id: 'a', createdAt: '2024-01-01' },
      { id: 'b', createdAt: '2026-08-01' }
    ]

    expect(analysisStore.analysisHistory.map((item) => item.id)).toEqual(['a', 'b'])

    const recent = analysisStore.recentAnalyses

    expect(recent[0].id).toBe('b')
    expect(analysisStore.analysisHistory.map((item) => item.id)).toEqual(['b', 'a'])
  })
})
