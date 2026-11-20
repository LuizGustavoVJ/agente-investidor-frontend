import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder: validação e persistência rasa', () => {
  let wrapper
  let alertSpy

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    alertSpy.mockRestore()
    wrapper.unmount()
  })

  it('isMethodologyValid não exige critérios, saída nem perfil de risco', () => {
    wrapper.vm.methodology.name = 'Value'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'desc'
    wrapper.vm.methodology.entryRules.push({ indicator: 'pe' })

    expect(wrapper.vm.methodology.criteria).toEqual([])
    expect(wrapper.vm.methodology.exitRules).toEqual([])
    expect(wrapper.vm.methodology.riskProfile).toBe('')
    expect(wrapper.vm.isMethodologyValid).toBeTruthy()
  })

  it('goToStep permite pular direto para o último passo', () => {
    expect(wrapper.vm.currentStep).toBe(0)
    wrapper.vm.goToStep(5)
    expect(wrapper.vm.currentStep).toBe(5)
  })

  it('addRule não preenche type da regra mesmo sendo entry/exit', () => {
    wrapper.vm.addRule('entry')
    expect(wrapper.vm.methodology.entryRules[0].type).toBe('')
  })

  it('editMethodology copia o id da salva para o formulário', () => {
    const saved = {
      id: 77,
      name: 'Value Conservador',
      category: 'value',
      description: 'x',
      riskProfile: 'conservative',
      timeHorizon: 'long',
      criteria: [],
      entryRules: [],
      exitRules: [],
      riskManagement: { maxPositionSize: 5 }
    }

    wrapper.vm.editMethodology(saved)

    expect(wrapper.vm.methodology.id).toBe(77)
    expect(wrapper.vm.currentStep).toBe(0)
  })

  it('formatPercentage multiplica por 100; formatNumber(undefined) lança', () => {
    expect(wrapper.vm.formatPercentage(0.1847)).toBe('18.47%')
    expect(() => wrapper.vm.formatNumber(undefined)).toThrow()
  })

  it('saveMethodology não reseta riskManagement aninhado', () => {
    wrapper.vm.methodology.name = 'X'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'd'
    wrapper.vm.methodology.riskManagement.maxPositionSize = 3
    wrapper.vm.methodology.entryRules.push({ indicator: 'pe' })

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.methodology.riskManagement.maxPositionSize).toBe(3)
    expect(wrapper.vm.methodology.name).toBe('')
  })
})
