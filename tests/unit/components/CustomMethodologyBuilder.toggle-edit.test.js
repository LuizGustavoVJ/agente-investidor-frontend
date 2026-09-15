import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — toggle duplo e edit rasa', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('clique no checkbox dispara change e click no card — o critério não fica selecionado', async () => {
    wrapper.vm.currentStep = 1
    await wrapper.vm.$nextTick()

    const checkbox = wrapper.find('input.toggle-checkbox')
    expect(checkbox.exists()).toBe(true)
    expect(wrapper.vm.methodology.criteria).toHaveLength(0)

    checkbox.element.dispatchEvent(new Event('change', { bubbles: true }))
    checkbox.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.methodology.criteria).toHaveLength(0)
    expect(wrapper.vm.isCriterionActive('pe_ratio')).toBe(false)
  })

  it('clique no card (sem o checkbox) seleciona o critério uma vez', async () => {
    wrapper.vm.currentStep = 1
    await wrapper.vm.$nextTick()

    await wrapper.find('.criterion-card').trigger('click')

    expect(wrapper.vm.isCriterionActive('pe_ratio')).toBe(true)
    expect(wrapper.vm.methodology.criteria).toHaveLength(1)
  })

  it('editMethodology compartilha arrays aninhados e saveMethodology duplica em vez de atualizar', () => {
    const original = {
      id: 42,
      name: 'Momentum RSI',
      category: 'momentum',
      description: 'entrada por RSI',
      riskProfile: 'aggressive',
      timeHorizon: 'short',
      criteria: [{ id: 'pe_ratio', operator: 'lt', value: '15', weight: 50 }],
      entryRules: [{ type: 'technical', indicator: 'rsi' }],
      exitRules: [],
      entryLogic: 'and',
      exitLogic: 'or',
      status: 'active'
    }

    wrapper.vm.savedMethodologies.push(original)
    const countBeforeSave = wrapper.vm.savedMethodologies.length
    wrapper.vm.editMethodology(original)

    expect(wrapper.vm.methodology.id).toBe(42)

    wrapper.vm.methodology.criteria[0].value = '8'
    wrapper.vm.methodology.entryRules.push({ type: 'price', indicator: 'close_price' })

    expect(original.criteria[0].value).toBe('8')
    expect(original.entryRules).toHaveLength(2)

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.savedMethodologies).toHaveLength(countBeforeSave + 1)
    expect(original.criteria[0].value).toBe('8')
    expect(wrapper.vm.savedMethodologies.filter(m => m.id === 42)).toHaveLength(2)
  })
})
