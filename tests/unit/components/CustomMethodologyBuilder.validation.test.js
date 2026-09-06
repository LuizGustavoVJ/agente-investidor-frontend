import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — checklist de validação e regras', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.restoreAllMocks()
  })

  it('marca informações básicas e regras de entrada como erro até estarem preenchidas', () => {
    const byId = Object.fromEntries(wrapper.vm.validationResults.map((item) => [item.id, item]))

    expect(byId.basic_info.status).toBe('error')
    expect(byId.entry_rules.status).toBe('error')
    expect(byId.criteria.status).toBe('warning')
    expect(byId.exit_rules.status).toBe('warning')
    expect(wrapper.vm.isMethodologyValid).toBeFalsy()
  })

  it('sobe para success quando há nome, categoria, descrição, critério e regras', async () => {
    wrapper.vm.methodology.name = 'Value'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Margem de segurança'
    wrapper.vm.methodology.criteria.push({ id: 'pe_ratio', operator: 'less_than', value: '15' })
    wrapper.vm.methodology.entryRules.push({ type: 'fundamental', indicator: 'pe_ratio' })
    wrapper.vm.methodology.exitRules.push({ type: 'technical', indicator: 'rsi' })
    await wrapper.vm.$nextTick()

    const byId = Object.fromEntries(wrapper.vm.validationResults.map((item) => [item.id, item]))

    expect(byId.basic_info.status).toBe('success')
    expect(byId.criteria.status).toBe('success')
    expect(byId.criteria.message).toContain('1 critérios')
    expect(byId.entry_rules.status).toBe('success')
    expect(byId.exit_rules.status).toBe('success')
    expect(wrapper.vm.isMethodologyValid).toBeTruthy()
  })

  it('remove regra de entrada pelo índice sem afetar as de saída', () => {
    wrapper.vm.addRule('entry')
    wrapper.vm.addRule('entry')
    wrapper.vm.addRule('exit')
    wrapper.vm.methodology.entryRules[0].indicator = 'rsi'
    wrapper.vm.methodology.entryRules[1].indicator = 'macd'
    wrapper.vm.methodology.exitRules[0].indicator = 'sma_20'

    wrapper.vm.removeRule('entry', 0)

    expect(wrapper.vm.methodology.entryRules.map((rule) => rule.indicator)).toEqual(['macd'])
    expect(wrapper.vm.methodology.exitRules.map((rule) => rule.indicator)).toEqual(['sma_20'])
  })

  it('devolve lista vazia para tipo de indicador desconhecido', () => {
    expect(wrapper.vm.getIndicatorsByType('desconhecido')).toEqual([])
    expect(wrapper.vm.getIndicatorsByType('technical').some((item) => item.value === 'rsi')).toBe(
      true
    )
  })

  it('bloqueia avanço no passo 2 sem regra de entrada e libera no passo de critérios', async () => {
    wrapper.vm.methodology.name = 'Value'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Desc'
    wrapper.vm.methodology.riskProfile = 'conservative'
    wrapper.vm.methodology.timeHorizon = 'long'
    wrapper.vm.currentStep = 1
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.canProceedToNextStep()).toBe(true)

    wrapper.vm.currentStep = 2
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.canProceedToNextStep()).toBe(false)

    wrapper.vm.methodology.entryRules.push({ type: 'price', indicator: 'close_price' })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.canProceedToNextStep()).toBe(true)
  })
})
