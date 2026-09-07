import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — navegação do wizard e edição', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('previousStep não desce abaixo de 0 e volta um passo depois de avançar', async () => {
    wrapper.vm.previousStep()
    expect(wrapper.vm.currentStep).toBe(0)

    wrapper.vm.methodology.name = 'Value'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Ações baratas'
    wrapper.vm.methodology.riskProfile = 'conservative'
    wrapper.vm.methodology.timeHorizon = 'long'
    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(1)

    wrapper.vm.previousStep()
    expect(wrapper.vm.currentStep).toBe(0)
  })

  it('goToStep permite voltar para um passo já visitado', () => {
    wrapper.vm.currentStep = 3
    wrapper.vm.goToStep(1)
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('editMethodology carrega a metodologia salva e reseta o wizard', () => {
    const saved = wrapper.vm.savedMethodologies[0]
    wrapper.vm.currentStep = 4
    wrapper.vm.editMethodology(saved)

    expect(wrapper.vm.currentStep).toBe(0)
    expect(wrapper.vm.methodology.name).toBe(saved.name)
    expect(wrapper.vm.methodology.category).toBe(saved.category)
  })

  it('canProceedToNextStep é false em passo desconhecido', () => {
    wrapper.vm.currentStep = 99
    expect(wrapper.vm.canProceedToNextStep()).toBe(false)
  })
})
