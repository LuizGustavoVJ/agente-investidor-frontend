import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — persistência rasa e wizard pulável', () => {
  let wrapper
  let alertSpy
  let confirmSpy

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    alertSpy.mockRestore()
    confirmSpy.mockRestore()
  })

  it('goToStep permite pular para a revisão sem validar passos intermediários', () => {
    expect(wrapper.vm.currentStep).toBe(0)
    expect(wrapper.vm.methodology.name).toBe('')
    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()

    wrapper.vm.goToStep(5)

    expect(wrapper.vm.currentStep).toBe(5)
  })

  it('saveMethodology não reseta riskManagement aninhado e compartilha a mesma referência', () => {
    wrapper.vm.methodology.name = 'Value'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'desc'
    wrapper.vm.methodology.riskManagement.maxPositionSize = 3

    wrapper.vm.saveMethodology()

    const saved = wrapper.vm.savedMethodologies.at(-1)
    expect(saved.riskManagement).toBe(wrapper.vm.methodology.riskManagement)
    expect(wrapper.vm.methodology.riskManagement.maxPositionSize).toBe(3)
    expect(wrapper.vm.methodology.name).toBe('')

    saved.riskManagement.maxPositionSize = 99
    expect(wrapper.vm.methodology.riskManagement.maxPositionSize).toBe(99)
  })

  it('cloneMethodology faz Object.assign raso — mutar risco da cópia altera a origem', () => {
    const saved = {
      id: 10,
      name: 'Origem',
      category: 'value',
      description: 'd',
      riskProfile: 'conservative',
      timeHorizon: 'long',
      criteria: [],
      entryRules: [],
      exitRules: [],
      riskManagement: { maxPositionSize: 10, maxPositions: 20 }
    }

    wrapper.vm.cloneMethodology(saved)
    expect(wrapper.vm.methodology.name).toBe('Origem (Cópia)')

    wrapper.vm.methodology.riskManagement.maxPositionSize = 1
    expect(saved.riskManagement.maxPositionSize).toBe(1)
  })

  it('toggleCriterion para operador between só guarda um value — não há min/max', () => {
    const betweenCriterion = wrapper.vm.availableCriteria.find(c =>
      c.operators.some(op => op.value === 'between')
    )

    wrapper.vm.toggleCriterion(betweenCriterion)
    const config = wrapper.vm.getCriterionConfig(betweenCriterion.id)

    expect(config.operator).toBe(betweenCriterion.operators[0].value)
    expect(config).toHaveProperty('value')
    expect(config).not.toHaveProperty('min')
    expect(config).not.toHaveProperty('max')
    expect(config).not.toHaveProperty('value2')
  })

  it('isMethodologyValid não exige regras de saída nem gestão de risco', () => {
    wrapper.vm.methodology.name = 'X'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'd'
    wrapper.vm.methodology.entryRules = []
    expect(wrapper.vm.isMethodologyValid).toBe(false)

    wrapper.vm.methodology.entryRules.push({ type: 'price' })
    expect(wrapper.vm.isMethodologyValid).toBe(true)
    expect(wrapper.vm.methodology.exitRules).toEqual([])
  })
})
