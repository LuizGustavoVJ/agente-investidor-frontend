import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — toggle duplo e critério vazio', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('change no checkbox + click no card desliga o critério que o usuário acabou de ligar', async () => {
    wrapper.vm.currentStep = 1
    await wrapper.vm.$nextTick()

    const card = wrapper.find('.criterion-card')
    const checkbox = card.find('input.toggle-checkbox')
    expect(card.exists()).toBe(true)
    expect(checkbox.exists()).toBe(true)
    expect(wrapper.vm.methodology.criteria).toHaveLength(0)

    await checkbox.trigger('change')
    await card.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.methodology.criteria).toHaveLength(0)
    expect(wrapper.vm.isCriterionActive('pe_ratio')).toBe(false)
  })

  it('um único toggle grava critério com value vazio e validationResults marca success', async () => {
    const pe = wrapper.vm.availableCriteria.find((c) => c.id === 'pe_ratio')
    wrapper.vm.toggleCriterion(pe)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.methodology.criteria).toHaveLength(1)
    expect(wrapper.vm.methodology.criteria[0]).toMatchObject({
      id: 'pe_ratio',
      value: '',
      operator: 'lt'
    })

    const criteria = wrapper.vm.validationResults.find((r) => r.id === 'criteria')
    expect(criteria.status).toBe('success')
    expect(criteria.message).toContain('1 critérios')
  })
})
