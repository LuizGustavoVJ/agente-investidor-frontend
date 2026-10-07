import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — reset após save deixa risco e operadores inconsistentes', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    setActivePinia(createPinia())
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('saveMethodology zera entryLogic/exitLogic e não reseta riskManagement', () => {
    wrapper.vm.methodology.name = 'Value com stop'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'P/L baixo'
    wrapper.vm.methodology.entryLogic = 'and'
    wrapper.vm.methodology.exitLogic = 'or'
    wrapper.vm.methodology.riskManagement.maxPositionSize = 99
    wrapper.vm.methodology.riskManagement.useStopLoss = true
    wrapper.vm.methodology.riskManagement.globalStopLoss = 7
    wrapper.vm.methodology.entryRules.push({ type: 'price', indicator: 'close_price' })

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.methodology.entryLogic).toBe('')
    expect(wrapper.vm.methodology.exitLogic).toBe('')
    expect(wrapper.vm.methodology.riskManagement.maxPositionSize).toBe(99)
    expect(wrapper.vm.methodology.riskManagement.useStopLoss).toBe(true)
    expect(wrapper.vm.methodology.riskManagement.globalStopLoss).toBe(7)
  })

  it('a metodologia salva compartilha o mesmo objeto riskManagement do formulário', () => {
    wrapper.vm.methodology.name = 'Compartilhada'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Risco compartilhado'
    wrapper.vm.methodology.riskManagement.maxPositionSize = 12
    wrapper.vm.methodology.entryRules.push({ type: 'price' })

    wrapper.vm.saveMethodology()

    const saved = wrapper.vm.savedMethodologies.at(-1)
    expect(saved.riskManagement).toBe(wrapper.vm.methodology.riskManagement)

    wrapper.vm.methodology.riskManagement.maxPositionSize = 3
    expect(saved.riskManagement.maxPositionSize).toBe(3)
  })
})
