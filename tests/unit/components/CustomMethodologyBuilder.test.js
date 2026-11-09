import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — validação e wizard', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  const fillBasicInfo = async () => {
    wrapper.vm.methodology.name = 'Value Conservador'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Compra barato'
    wrapper.vm.methodology.riskProfile = 'conservative'
    wrapper.vm.methodology.timeHorizon = 'long'
    await wrapper.vm.$nextTick()
  }

  it('começa inválido sem informações básicas nem regras de entrada', () => {
    expect(wrapper.vm.isMethodologyValid).toBeFalsy()
    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()
    expect(wrapper.vm.validationResults.find(r => r.id === 'basic_info').status).toBe('error')
    expect(wrapper.vm.validationResults.find(r => r.id === 'entry_rules').status).toBe('error')
  })

  it('validateStep marca campos obrigatórios do passo inicial', () => {
    wrapper.vm.validateStep()

    expect(wrapper.vm.errors.name).toBe('Nome é obrigatório')
    expect(wrapper.vm.errors.category).toBe('Categoria é obrigatória')
    expect(wrapper.vm.errors.description).toBe('Descrição é obrigatória')
    expect(wrapper.vm.errors.riskProfile).toBe('Perfil de risco é obrigatório')
    expect(wrapper.vm.errors.timeHorizon).toBe('Horizonte de investimento é obrigatório')
  })

  it('avança do passo 0 somente com dados básicos completos', async () => {
    await fillBasicInfo()

    expect(wrapper.vm.canProceedToNextStep()).toBeTruthy()
    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('não avança o wizard quando a validação do passo falha', () => {
    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(0)
  })

  it('exige pelo menos uma regra de entrada para ser válida', async () => {
    await fillBasicInfo()
    wrapper.vm.currentStep = 2

    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()
    expect(wrapper.vm.isMethodologyValid).toBeFalsy()

    wrapper.vm.addRule('entry')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.methodology.entryRules).toHaveLength(1)
    expect(wrapper.vm.canProceedToNextStep()).toBeTruthy()
    expect(wrapper.vm.isMethodologyValid).toBeTruthy()
    expect(wrapper.vm.validationResults.find(r => r.id === 'entry_rules').status).toBe('success')
  })

  it('alerta quando não há critérios nem regras de saída', () => {
    const criteria = wrapper.vm.validationResults.find(r => r.id === 'criteria')
    const exitRules = wrapper.vm.validationResults.find(r => r.id === 'exit_rules')

    expect(criteria.status).toBe('warning')
    expect(exitRules.status).toBe('warning')
  })

  it('toggleCriterion adiciona e remove critério com operador padrão e peso', () => {
    const criterion = wrapper.vm.availableCriteria.find(c => c.id === 'pe_ratio')

    wrapper.vm.toggleCriterion(criterion)
    expect(wrapper.vm.isCriterionActive('pe_ratio')).toBe(true)
    expect(wrapper.vm.getCriterionConfig('pe_ratio')).toMatchObject({
      id: 'pe_ratio',
      operator: 'lt',
      value: '',
      weight: 50
    })

    wrapper.vm.toggleCriterion(criterion)
    expect(wrapper.vm.isCriterionActive('pe_ratio')).toBe(false)
  })

  it('removeRule exclui apenas a regra do tipo indicado', () => {
    wrapper.vm.addRule('entry')
    wrapper.vm.addRule('entry')
    wrapper.vm.addRule('exit')

    wrapper.vm.removeRule('entry', 0)

    expect(wrapper.vm.methodology.entryRules).toHaveLength(1)
    expect(wrapper.vm.methodology.exitRules).toHaveLength(1)
  })

  it('previousStep não desce abaixo de zero', () => {
    wrapper.vm.previousStep()
    expect(wrapper.vm.currentStep).toBe(0)
  })

  it('getIndicatorsByType devolve indicadores conhecidos e lista vazia para tipo inválido', () => {
    expect(wrapper.vm.getIndicatorsByType('technical').some(i => i.value === 'rsi')).toBe(true)
    expect(wrapper.vm.getIndicatorsByType('fundamental').some(i => i.value === 'pe_ratio')).toBe(true)
    expect(wrapper.vm.getIndicatorsByType('desconhecido')).toEqual([])
  })
})
