import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — save compartilha riskManagement e zera lógica', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  function fillBasicInfo() {
    wrapper.vm.methodology.name = 'Value com stop'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'estratégia de teste'
    wrapper.vm.methodology.riskProfile = 'conservative'
    wrapper.vm.methodology.timeHorizon = 'long'
    wrapper.vm.methodology.entryRules.push({
      type: 'fundamental',
      indicator: 'pe_ratio',
      condition: 'lt',
      value: 15,
      description: 'P/L < 15'
    })
    wrapper.vm.methodology.riskManagement.maxPositionSize = 10
    wrapper.vm.methodology.riskManagement.useStopLoss = true
    wrapper.vm.methodology.riskManagement.globalStopLoss = 15
  }

  it('saveMethodology espalha riskManagement por referência — editar o wizard muda as cards salvas', () => {
    fillBasicInfo()
    const beforeCount = wrapper.vm.savedMethodologies.length

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.savedMethodologies).toHaveLength(beforeCount + 1)
    const saved = wrapper.vm.savedMethodologies[beforeCount]
    expect(saved.riskManagement).toBe(wrapper.vm.methodology.riskManagement)

    wrapper.vm.methodology.riskManagement.maxPositionSize = 25
    wrapper.vm.methodology.riskManagement.globalStopLoss = 5

    expect(saved.riskManagement.maxPositionSize).toBe(25)
    expect(saved.riskManagement.globalStopLoss).toBe(5)
    expect(saved.riskManagement.useStopLoss).toBe(true)
  })

  it('o reset pós-save zera entryLogic/exitLogic para string vazia em vez dos defaults and/or', () => {
    fillBasicInfo()
    expect(wrapper.vm.methodology.entryLogic).toBe('and')
    expect(wrapper.vm.methodology.exitLogic).toBe('or')

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.methodology.entryLogic).toBe('')
    expect(wrapper.vm.methodology.exitLogic).toBe('')
    expect(wrapper.vm.methodology.riskManagement.maxPositionSize).toBe(10)
  })

  it('editar e salvar de novo reusa o id original — duas cards compartilham a mesma chave', () => {
    const original = wrapper.vm.savedMethodologies[0]
    const originalId = original.id

    wrapper.vm.editMethodology(original)
    wrapper.vm.saveMethodology()

    const withSameId = wrapper.vm.savedMethodologies.filter((m) => m.id === originalId)
    expect(withSameId).toHaveLength(2)
  })
})
