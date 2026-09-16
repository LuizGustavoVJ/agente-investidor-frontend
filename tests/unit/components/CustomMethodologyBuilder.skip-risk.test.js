import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — pulo do wizard e risco herdado', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('goToStep pula do início para a revisão sem validar passos intermediários', () => {
    expect(wrapper.vm.currentStep).toBe(0)
    expect(wrapper.vm.methodology.name).toBe('')
    expect(wrapper.vm.methodology.entryRules).toEqual([])

    wrapper.vm.goToStep(5)

    expect(wrapper.vm.currentStep).toBe(5)
  })

  it('isMethodologyValid não exige perfil de risco, horizonte nem critérios', async () => {
    wrapper.vm.methodology.name = 'Value'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Margem de segurança'
    wrapper.vm.methodology.riskProfile = ''
    wrapper.vm.methodology.timeHorizon = ''
    wrapper.vm.methodology.criteria = []
    wrapper.vm.methodology.entryRules.push({ type: 'price', indicator: 'close_price' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isMethodologyValid).toBeTruthy()
    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()
  })

  it('saveMethodology preserva riskManagement da metodologia anterior', () => {
    wrapper.vm.methodology.name = 'Momentum'
    wrapper.vm.methodology.category = 'momentum'
    wrapper.vm.methodology.description = 'Cruzamento'
    wrapper.vm.methodology.riskProfile = 'aggressive'
    wrapper.vm.methodology.timeHorizon = 'short'
    wrapper.vm.addRule('entry')
    wrapper.vm.methodology.riskManagement.maxPositionSize = 42
    wrapper.vm.methodology.riskManagement.useStopLoss = true
    wrapper.vm.methodology.riskManagement.globalStopLoss = 7

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.methodology.riskManagement.maxPositionSize).toBe(42)
    expect(wrapper.vm.methodology.riskManagement.useStopLoss).toBe(true)
    expect(wrapper.vm.methodology.riskManagement.globalStopLoss).toBe(7)
    expect(wrapper.vm.methodology.name).toBe('')
    expect(wrapper.vm.methodology.entryRules).toEqual([])
  })
})
