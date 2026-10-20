import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

const staleResults = {
  totalReturn: 0.99,
  sharpeRatio: 4.2,
  maxDrawdown: -0.01,
  totalTrades: 777,
  winRate: 0.91,
  alpha: 0.33
}

describe('CustomMethodologyBuilder — Editar não limpa testResults do review', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('editMethodology copia a meta salva, volta ao passo 0 e deixa o backtest anterior', async () => {
    wrapper.vm.testResults = { ...staleResults }
    wrapper.vm.currentStep = 5
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.test-results').exists()).toBe(true)
    expect(wrapper.text()).toContain('777')

    const saved = wrapper.vm.savedMethodologies.find((item) => item.name === 'Value Conservador')
    wrapper.vm.editMethodology(saved)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentStep).toBe(0)
    expect(wrapper.vm.methodology.name).toBe('Value Conservador')
    expect(wrapper.vm.methodology.category).toBe('value')
    expect(wrapper.vm.methodology.riskProfile).toBe('conservative')
    expect(wrapper.vm.testResults).toEqual(staleResults)
    expect(wrapper.vm.testResults.totalTrades).toBe(777)
    expect(wrapper.find('.test-results').exists()).toBe(false)
  })

  it('voltar ao review depois de editar mostra o teste da metodologia anterior', async () => {
    wrapper.vm.testResults = { ...staleResults }
    wrapper.vm.methodology.name = 'Rascunho Momentum'
    wrapper.vm.methodology.category = 'momentum'

    const saved = wrapper.vm.savedMethodologies.find((item) => item.name === 'Value Conservador')
    wrapper.vm.editMethodology(saved)
    wrapper.vm.goToStep(5)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentStep).toBe(5)
    expect(wrapper.vm.methodology.name).toBe('Value Conservador')
    expect(wrapper.find('.test-results').exists()).toBe(true)
    expect(wrapper.text()).toContain('Resultados do Teste (2 anos)')
    expect(wrapper.text()).toContain('777')
    expect(wrapper.vm.testResults.totalReturn).toBe(0.99)
    expect(wrapper.vm.testResults.alpha).toBe(0.33)
  })

  it('cloneMethodology também preserva testResults stale', () => {
    wrapper.vm.testResults = { ...staleResults }
    const saved = wrapper.vm.savedMethodologies.find((item) => item.name === 'Growth Agressivo')

    wrapper.vm.cloneMethodology(saved)

    expect(wrapper.vm.methodology.name).toBe('Growth Agressivo (Cópia)')
    expect(wrapper.vm.currentStep).toBe(0)
    expect(wrapper.vm.testResults.totalTrades).toBe(777)
    expect(wrapper.vm.testResults.totalReturn).toBe(0.99)
  })
})
