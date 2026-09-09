import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — wizard e reset após salvar', () => {
  let wrapper
  let alertSpy

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
    alertSpy.mockRestore()
  })

  it('goToStep avança para a revisão sem exigir passos anteriores', () => {
    expect(wrapper.vm.currentStep).toBe(0)
    expect(wrapper.vm.methodology.name).toBe('')
    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()

    wrapper.vm.goToStep(5)

    expect(wrapper.vm.currentStep).toBe(5)
    expect(wrapper.vm.methodology.entryRules).toEqual([])
  })

  it('após salvar, riskManagement não é resetado e vaza para a próxima metodologia', () => {
    const savedBefore = wrapper.vm.savedMethodologies.length

    wrapper.vm.methodology.name = 'Value'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Margem de segurança'
    wrapper.vm.methodology.riskProfile = 'conservative'
    wrapper.vm.methodology.timeHorizon = 'long'
    wrapper.vm.methodology.riskManagement.maxPositionSize = 99
    wrapper.vm.methodology.riskManagement.useStopLoss = true
    wrapper.vm.methodology.entryLogic = 'and'
    wrapper.vm.addRule('entry')

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.savedMethodologies).toHaveLength(savedBefore + 1)
    expect(wrapper.vm.savedMethodologies.at(-1).name).toBe('Value')
    expect(wrapper.vm.methodology.name).toBe('')
    expect(wrapper.vm.methodology.entryRules).toEqual([])
    expect(wrapper.vm.methodology.riskManagement.maxPositionSize).toBe(99)
    expect(wrapper.vm.methodology.riskManagement.useStopLoss).toBe(true)
  })
})
