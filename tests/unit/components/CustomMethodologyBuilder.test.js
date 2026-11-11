import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    data: { datasets: [] },
    options: {}
  }))
}))

describe('CustomMethodologyBuilder — wizard e regras', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('não avança o passo inicial sem dados obrigatórios', async () => {
    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()

    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(0)

    wrapper.vm.validateStep()
    expect(wrapper.vm.errors.name).toBe('Nome é obrigatório')
    expect(wrapper.vm.errors.category).toBe('Categoria é obrigatória')
    expect(wrapper.vm.errors.description).toBe('Descrição é obrigatória')
    expect(wrapper.vm.errors.riskProfile).toBe('Perfil de risco é obrigatório')
    expect(wrapper.vm.errors.timeHorizon).toBe('Horizonte de investimento é obrigatório')
  })

  it('avança quando o passo 0 está completo', async () => {
    wrapper.vm.methodology.name = 'Value custom'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Compra abaixo do valor intrínseco'
    wrapper.vm.methodology.riskProfile = 'moderado'
    wrapper.vm.methodology.timeHorizon = 'longo'

    expect(wrapper.vm.canProceedToNextStep()).toBeTruthy()
    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('no passo de entrada exige pelo menos uma regra', async () => {
    wrapper.vm.currentStep = 2
    wrapper.vm.methodology.entryRules = []

    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()

    wrapper.vm.addRule('entry')
    expect(wrapper.vm.methodology.entryRules).toHaveLength(1)
    expect(wrapper.vm.canProceedToNextStep()).toBeTruthy()
  })

  it('toggleCriterion adiciona com operador padrão e remove na segunda chamada', () => {
    const criterion = wrapper.vm.availableCriteria[0]
    expect(criterion).toBeTruthy()

    wrapper.vm.toggleCriterion(criterion)
    expect(wrapper.vm.isCriterionActive(criterion.id)).toBe(true)
    expect(wrapper.vm.getCriterionConfig(criterion.id).operator).toBe(criterion.operators[0].value)

    wrapper.vm.toggleCriterion(criterion)
    expect(wrapper.vm.isCriterionActive(criterion.id)).toBe(false)
  })

  it('removeRule distingue regras de entrada e saída', () => {
    wrapper.vm.addRule('entry')
    wrapper.vm.addRule('entry')
    wrapper.vm.addRule('exit')

    wrapper.vm.removeRule('entry', 0)
    expect(wrapper.vm.methodology.entryRules).toHaveLength(1)
    expect(wrapper.vm.methodology.exitRules).toHaveLength(1)

    wrapper.vm.removeRule('exit', 0)
    expect(wrapper.vm.methodology.exitRules).toHaveLength(0)
  })

  it('previousStep não desce abaixo de zero', () => {
    wrapper.vm.currentStep = 0
    wrapper.vm.previousStep()
    expect(wrapper.vm.currentStep).toBe(0)
  })
})
