import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — clone rasa e formatNumber', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('cloneMethodology compartilha arrays aninhados — editar a cópia muta a original', () => {
    const original = {
      id: 99,
      name: 'Value com PE',
      category: 'value',
      description: 'critério compartilhado',
      riskProfile: 'conservative',
      timeHorizon: 'long',
      criteria: [{ id: 'pe', operator: 'lt', value: '15', weight: 50 }],
      entryRules: [{ type: 'technical', indicator: 'rsi' }],
      exitRules: [],
      entryLogic: 'and',
      exitLogic: 'or',
      status: 'active'
    }

    wrapper.vm.savedMethodologies.push(original)
    wrapper.vm.cloneMethodology(original)

    expect(wrapper.vm.methodology.name).toBe('Value com PE (Cópia)')
    expect(wrapper.vm.methodology.id).toBeUndefined()

    wrapper.vm.methodology.criteria[0].value = '8'
    wrapper.vm.methodology.criteria.push({ id: 'roe', operator: 'gt', value: '20' })
    wrapper.vm.methodology.entryRules.push({ type: 'price', indicator: 'close_price' })

    expect(original.criteria[0].value).toBe('8')
    expect(original.criteria).toHaveLength(2)
    expect(original.entryRules).toHaveLength(2)
    expect(original.name).toBe('Value com PE')
  })

  it('formatNumber lança se o valor for undefined (ex.: sharpeRatio ausente)', () => {
    expect(() => wrapper.vm.formatNumber(undefined)).toThrow(TypeError)
    expect(wrapper.vm.formatNumber(1.234)).toBe('1.23')
  })
})
