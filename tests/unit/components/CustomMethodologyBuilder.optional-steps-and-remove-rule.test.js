import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder: passos opcionais e removeRule', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('canProceedToNextStep nos passos 1, 3 e 4 é true mesmo sem critérios, saída ou risco extra', () => {
    wrapper.vm.methodology.criteria = []
    wrapper.vm.methodology.exitRules = []
    wrapper.vm.methodology.riskManagement.stopLoss = 0

    wrapper.vm.currentStep = 1
    expect(wrapper.vm.canProceedToNextStep()).toBe(true)

    wrapper.vm.currentStep = 3
    expect(wrapper.vm.canProceedToNextStep()).toBe(true)

    wrapper.vm.currentStep = 4
    expect(wrapper.vm.canProceedToNextStep()).toBe(true)
  })

  it('nextStep no passo de critérios avança sem nenhuma regra de entrada ainda configurada ali', () => {
    wrapper.vm.currentStep = 1
    wrapper.vm.methodology.criteria = []
    wrapper.vm.methodology.entryRules = []

    wrapper.vm.nextStep()

    expect(wrapper.vm.currentStep).toBe(2)
  })

  it('removeRule tira a regra de entrada pelo índice e deixa o restante', () => {
    wrapper.vm.methodology.entryRules = [
      { type: 'price', indicator: 'close_price', condition: '>', value: '10' },
      { type: 'technical', indicator: 'rsi', condition: '<', value: '30' }
    ]

    wrapper.vm.removeRule('entry', 0)

    expect(wrapper.vm.methodology.entryRules).toHaveLength(1)
    expect(wrapper.vm.methodology.entryRules[0].indicator).toBe('rsi')
  })

  it('isMethodologyValid ignora perfil de risco, horizonte e regras de saída', () => {
    wrapper.vm.methodology.name = 'Minha'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'desc'
    wrapper.vm.methodology.riskProfile = ''
    wrapper.vm.methodology.timeHorizon = ''
    wrapper.vm.methodology.entryRules = [{ type: 'price' }]
    wrapper.vm.methodology.exitRules = []

    expect(wrapper.vm.isMethodologyValid).toBe(true)
  })
})
