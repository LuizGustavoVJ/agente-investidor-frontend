import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'
import { useAnalysisStore } from '@/stores/analysis'

describe('CustomMethodologyBuilder — persistência só local, sem analysis store', () => {
  let wrapper
  let analysisStore

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    setActivePinia(createPinia())
    analysisStore = useAnalysisStore()
    vi.spyOn(analysisStore, 'saveAnalysis')
    vi.spyOn(analysisStore, 'fetchMethodologies')
    vi.spyOn(analysisStore, 'fetchSavedAnalyses')
    vi.spyOn(analysisStore, 'deleteSavedAnalysis')

    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('no mount carrega mock local e não busca metodologias nem análises salvas', () => {
    expect(analysisStore.fetchMethodologies).not.toHaveBeenCalled()
    expect(analysisStore.fetchSavedAnalyses).not.toHaveBeenCalled()
    expect(wrapper.vm.savedMethodologies).toHaveLength(2)
    expect(wrapper.vm.savedMethodologies[0].name).toBe('Value Conservador')
    expect(analysisStore.savedAnalyses).toEqual([])
    expect(analysisStore.methodologies).toEqual([])
  })

  it('saveMethodology só empurra na lista local e não chama saveAnalysis', () => {
    const localCountBefore = wrapper.vm.savedMethodologies.length

    wrapper.vm.methodology.name = 'Value com margem'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'P/L baixo'
    wrapper.vm.methodology.riskProfile = 'conservative'
    wrapper.vm.methodology.timeHorizon = 'long'
    wrapper.vm.methodology.entryRules.push({ type: 'price', indicator: 'close_price' })
    wrapper.vm.testResults = { totalReturn: 0.1847 }

    wrapper.vm.saveMethodology()

    expect(analysisStore.saveAnalysis).not.toHaveBeenCalled()
    expect(analysisStore.fetchSavedAnalyses).not.toHaveBeenCalled()
    expect(analysisStore.savedAnalyses).toEqual([])
    expect(wrapper.vm.savedMethodologies).toHaveLength(localCountBefore + 1)
    expect(wrapper.vm.savedMethodologies.at(-1)).toMatchObject({
      name: 'Value com margem',
      category: 'value',
      status: 'active',
      performance: 0.1847
    })
    expect(window.alert).toHaveBeenCalledWith('Metodologia salva com sucesso!')
  })

  it('deleteMethodology remove só o mock local e não chama deleteSavedAnalysis', () => {
    const saved = wrapper.vm.savedMethodologies[0]
    const id = saved.id

    wrapper.vm.deleteMethodology(saved)

    expect(window.confirm).toHaveBeenCalled()
    expect(wrapper.vm.savedMethodologies.find((item) => item.id === id)).toBeUndefined()
    expect(analysisStore.deleteSavedAnalysis).not.toHaveBeenCalled()
  })
})
