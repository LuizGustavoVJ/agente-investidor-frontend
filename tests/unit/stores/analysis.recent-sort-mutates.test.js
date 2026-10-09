import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis store — getters recent* ordenam in-place', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
  })

  it('recentRecommendations.sort reordena o array original de recomendações', () => {
    store.recommendations = [
      { id: 'old', createdAt: '2024-01-01T00:00:00.000Z', title: 'Antiga' },
      { id: 'mid', createdAt: '2025-06-01T00:00:00.000Z', title: 'Meio' },
      { id: 'new', createdAt: '2026-10-01T00:00:00.000Z', title: 'Nova' }
    ]

    const orderBefore = store.recommendations.map((r) => r.id)
    expect(orderBefore).toEqual(['old', 'mid', 'new'])

    const recent = store.recentRecommendations
    expect(recent[0].id).toBe('new')
    expect(store.recommendations.map((r) => r.id)).toEqual(['new', 'mid', 'old'])
    expect(store.recommendations.map((r) => r.id)).not.toEqual(orderBefore)
  })

  it('recentAnalyses.sort reordena o histórico original', () => {
    store.analysisHistory = [
      { id: 'a', createdAt: '2023-01-01T00:00:00.000Z' },
      { id: 'b', createdAt: '2026-09-01T00:00:00.000Z' }
    ]

    const orderBefore = store.analysisHistory.map((a) => a.id)
    expect(store.recentAnalyses[0].id).toBe('b')
    expect(store.analysisHistory.map((a) => a.id)).toEqual(['b', 'a'])
    expect(store.analysisHistory.map((a) => a.id)).not.toEqual(orderBefore)
  })

  it('segunda leitura não restaura a ordem da API — o array já está invertido', () => {
    store.recommendations = [
      { id: 'first-api', createdAt: '2020-01-01T00:00:00.000Z' },
      { id: 'last-api', createdAt: '2026-01-01T00:00:00.000Z' }
    ]

    void store.recentRecommendations
    expect(store.recommendations[0].id).toBe('last-api')

    void store.recentRecommendations
    expect(store.recommendations[0].id).toBe('last-api')
    expect(store.recommendations[1].id).toBe('first-api')
  })
})
