import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — save sem perfil de risco', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  function fillBasicsWithoutRisk() {
    wrapper.vm.methodology.name = 'Momentum sem risco'
    wrapper.vm.methodology.category = 'momentum'
    wrapper.vm.methodology.description = 'Compra rompimento sem definir perfil'
    wrapper.vm.addRule('entry')
    wrapper.vm.methodology.entryRules[0].type = 'technical'
    wrapper.vm.methodology.entryRules[0].indicator = 'rsi'
    wrapper.vm.methodology.entryRules[0].value = '30'
  }

  it('isMethodologyValid fica true sem riskProfile nem timeHorizon', () => {
    fillBasicsWithoutRisk()

    expect(wrapper.vm.methodology.riskProfile).toBe('')
    expect(wrapper.vm.methodology.timeHorizon).toBe('')
    expect(wrapper.vm.isMethodologyValid).toBe(true)
  })

  it('validationResults marca informações básicas como success mesmo sem risco', () => {
    fillBasicsWithoutRisk()

    const basic = wrapper.vm.validationResults.find((r) => r.id === 'basic_info')
    expect(basic).toBeTruthy()
    expect(basic.status).toBe('success')
  })

  it('goToStep pula o wizard e saveMethodology persiste estratégia sem perfil de risco', () => {
    fillBasicsWithoutRisk()

    wrapper.vm.goToStep(5)
    expect(wrapper.vm.currentStep).toBe(5)

    const before = wrapper.vm.savedMethodologies.length
    wrapper.vm.saveMethodology()

    const saved = wrapper.vm.savedMethodologies[wrapper.vm.savedMethodologies.length - 1]
    expect(wrapper.vm.savedMethodologies.length).toBe(before + 1)
    expect(saved.name).toBe('Momentum sem risco')
    expect(saved.riskProfile).toBe('')
    expect(saved.timeHorizon).toBe('')
    expect(saved.entryRules.length).toBe(1)
  })

  it('Next no passo 0 ainda exige risco — só o clique no step ignora a trava', () => {
    wrapper.vm.methodology.name = 'X'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Y'
    wrapper.vm.currentStep = 0

    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()
    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(0)

    wrapper.vm.goToStep(2)
    expect(wrapper.vm.currentStep).toBe(2)
  })
})
