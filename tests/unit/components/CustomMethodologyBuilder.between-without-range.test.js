import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — operador Entre sem intervalo completo', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('critério between só guarda value — não há maxValue no modelo nem na UI de filtros', () => {
    const pe = wrapper.vm.availableCriteria.find((criterion) => criterion.id === 'pe_ratio')
    expect(pe.operators.some((op) => op.value === 'between')).toBe(true)

    wrapper.vm.toggleCriterion(pe)
    const config = wrapper.vm.getCriterionConfig('pe_ratio')
    config.operator = 'between'
    config.value = 10

    expect(config.maxValue).toBeUndefined()
    expect(config.value2).toBeUndefined()
    expect(wrapper.vm.methodology.criteria[0]).not.toHaveProperty('maxValue')

    const criteriaResult = wrapper.vm.validationResults.find((item) => item.id === 'criteria')
    expect(criteriaResult.status).toBe('success')
    expect(wrapper.vm.getOperatorLabel('pe_ratio', 'between')).toBe('Entre')
  })

  it('regra de entrada between sem maxValue passa em canProceed e é persistida no save', () => {
    wrapper.vm.methodology.name = 'P/L entre faixas'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'intervalo incompleto'
    wrapper.vm.methodology.riskProfile = 'moderate'
    wrapper.vm.methodology.timeHorizon = 'medium'
    wrapper.vm.addRule('entry')
    const rule = wrapper.vm.methodology.entryRules[0]
    rule.type = 'fundamental'
    rule.indicator = 'pe_ratio'
    rule.condition = 'between'
    rule.value = 8
    rule.description = 'P/L entre 8 e ?'

    expect(rule.maxValue).toBeUndefined()
    wrapper.vm.currentStep = 2
    expect(wrapper.vm.canProceedToNextStep()).toBe(true)
    expect(wrapper.vm.isMethodologyValid).toBe(true)

    const beforeCount = wrapper.vm.savedMethodologies.length
    wrapper.vm.saveMethodology()

    const saved = wrapper.vm.savedMethodologies[beforeCount]
    expect(saved.entryRules[0].condition).toBe('between')
    expect(saved.entryRules[0].value).toBe(8)
    expect(saved.entryRules[0].maxValue).toBeUndefined()
  })
})
