import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    deleteSavedAnalysis: vi.fn()
  }
}))

import { analysisAPI } from '@/api/analysis'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis store — deleteSavedAnalysis com id string vs número', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('sucesso da API com id "1" não remove a análise local com id numérico 1', async () => {
    analysisAPI.deleteSavedAnalysis.mockResolvedValue({ data: { success: true } })
    const store = useAnalysisStore()
    store.savedAnalyses = [
      { id: 1, name: 'Value' },
      { id: 2, name: 'Growth' }
    ]

    const result = await store.deleteSavedAnalysis('1')

    expect(result.success).toBe(true)
    expect(store.savedAnalyses).toHaveLength(2)
    expect(store.savedAnalyses.map((a) => a.id)).toEqual([1, 2])
  })

  it('id numérico 1 remove a análise local correspondente', async () => {
    analysisAPI.deleteSavedAnalysis.mockResolvedValue({ data: { success: true } })
    const store = useAnalysisStore()
    store.savedAnalyses = [
      { id: 1, name: 'Value' },
      { id: 2, name: 'Growth' }
    ]

    const result = await store.deleteSavedAnalysis(1)

    expect(result.success).toBe(true)
    expect(store.savedAnalyses).toEqual([{ id: 2, name: 'Growth' }])
  })
})
