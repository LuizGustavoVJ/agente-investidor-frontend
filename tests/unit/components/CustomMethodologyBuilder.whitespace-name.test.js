import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — nome/descrição só com espaços', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('isMethodologyValid aceita name e description só com espaços', async () => {
    wrapper.vm.methodology.name = '   '
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = '   '
    wrapper.vm.methodology.entryRules.push({ type: 'price', indicator: 'close_price' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isMethodologyValid).toBe(true)
  })

  it('validateStep não marca erro para name/description em branco com espaços', () => {
    wrapper.vm.currentStep = 0
    wrapper.vm.methodology.name = '   '
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = '\t'
    wrapper.vm.methodology.riskProfile = 'moderate'
    wrapper.vm.methodology.timeHorizon = 'long'

    wrapper.vm.validateStep()

    expect(wrapper.vm.errors.name).toBeUndefined()
    expect(wrapper.vm.errors.description).toBeUndefined()
  })

  it('saveMethodology persiste metodologia com nome só de espaços', () => {
    wrapper.vm.methodology.name = '   '
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = '   '
    wrapper.vm.addRule('entry')

    const before = wrapper.vm.savedMethodologies.length
    wrapper.vm.saveMethodology()

    expect(wrapper.vm.savedMethodologies).toHaveLength(before + 1)
    const saved = wrapper.vm.savedMethodologies[wrapper.vm.savedMethodologies.length - 1]
    expect(saved.name).toBe('   ')
    expect(saved.description).toBe('   ')
    expect(saved.status).toBe('active')
  })
})
