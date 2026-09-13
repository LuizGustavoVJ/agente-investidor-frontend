import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — reset de lógica AND/OR após salvar', () => {
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

  it('saveMethodology zera entryLogic e exitLogic — a próxima metodologia perde AND/OR', () => {
    expect(wrapper.vm.methodology.entryLogic).toBe('and')
    expect(wrapper.vm.methodology.exitLogic).toBe('or')

    wrapper.vm.methodology.name = 'Momentum'
    wrapper.vm.methodology.category = 'momentum'
    wrapper.vm.methodology.description = 'Cruzamento de médias'
    wrapper.vm.methodology.riskProfile = 'aggressive'
    wrapper.vm.methodology.timeHorizon = 'short'
    wrapper.vm.addRule('entry')

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.methodology.entryLogic).toBe('')
    expect(wrapper.vm.methodology.exitLogic).toBe('')
    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()
  })
})
