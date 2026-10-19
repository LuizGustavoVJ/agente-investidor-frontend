import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'
import { analysisAPI } from '@/api/analysis'

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    deleteSavedAnalysis: vi.fn(),
    getAssetAnalysis: vi.fn(),
    saveAnalysis: vi.fn(),
    getSavedAnalyses: vi.fn()
  }
}))

describe('Analysis — delete com id string não remove e getAssetAnalysis quebra em string', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
    vi.clearAllMocks()
  })

  it('deleteSavedAnalysis("1") devolve sucesso e o item numérico permanece', async () => {
    store.savedAnalyses = [
      { id: 1, title: 'Value PETR4' },
      { id: 2, title: 'Growth VALE3' }
    ]
    analysisAPI.deleteSavedAnalysis.mockResolvedValue({ data: { success: true } })

    const result = await store.deleteSavedAnalysis('1')

    expect(result.success).toBe(true)
    expect(analysisAPI.deleteSavedAnalysis).toHaveBeenCalledWith('1')
    expect(store.savedAnalyses).toHaveLength(2)
    expect(store.savedAnalyses[0]).toEqual({ id: 1, title: 'Value PETR4' })
  })

  it('deleteSavedAnalysis(1) remove só o match estrito', async () => {
    store.savedAnalyses = [
      { id: 1, title: 'Value PETR4' },
      { id: 2, title: 'Growth VALE3' }
    ]
    analysisAPI.deleteSavedAnalysis.mockResolvedValue({ data: { success: true } })

    const result = await store.deleteSavedAnalysis(1)

    expect(result.success).toBe(true)
    expect(store.savedAnalyses).toEqual([{ id: 2, title: 'Growth VALE3' }])
  })
})
