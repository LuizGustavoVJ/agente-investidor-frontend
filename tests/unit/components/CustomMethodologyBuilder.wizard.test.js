import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — wizard, clone e persistência local', () => {
  let wrapper
  let alertSpy

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
    alertSpy.mockRestore()
    vi.useRealTimers()
  })

  it('goToStep pula direto para a revisão porque canProceedToStep sempre é true', () => {
    expect(wrapper.vm.currentStep).toBe(0)

    wrapper.vm.goToStep(5)

    expect(wrapper.vm.currentStep).toBe(5)
  })

  it('nextStep no passo 0 exige nome, categoria, descrição, risco e horizonte', () => {
    wrapper.vm.methodology.name = 'Minha'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(0)

    wrapper.vm.methodology.description = 'desc'
    wrapper.vm.methodology.riskProfile = 'moderate'
    wrapper.vm.methodology.timeHorizon = 'long'
    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('isMethodologyValid não exige regras de saída nem gestão de risco', () => {
    Object.assign(wrapper.vm.methodology, {
      name: 'X',
      category: 'value',
      description: 'd',
      entryRules: [{ type: 'price' }],
      exitRules: []
    })

    expect(wrapper.vm.isMethodologyValid).toBeTruthy()
    const exitResult = wrapper.vm.validationResults.find((r) => r.id === 'exit_rules')
    expect(exitResult.status).toBe('warning')
  })

  it('cloneMethodology compartilha o objeto riskManagement por referência', () => {
    const original = {
      id: 99,
      name: 'Base',
      category: 'value',
      description: 'd',
      riskManagement: { maxPositionSize: 10 }
    }
    wrapper.vm.savedMethodologies.push(original)

    wrapper.vm.cloneMethodology(original)
    wrapper.vm.methodology.riskManagement.maxPositionSize = 99

    expect(original.riskManagement.maxPositionSize).toBe(99)
    expect(wrapper.vm.methodology.name).toBe('Base (Cópia)')
    expect(wrapper.vm.methodology.id).toBeUndefined()
  })

  it('saveMethodology só grava em memória e não zera riskManagement', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-17T10:00:00.000Z'))

    wrapper.vm.methodology.name = 'Nova'
    wrapper.vm.methodology.category = 'growth'
    wrapper.vm.methodology.description = 'desc'
    wrapper.vm.methodology.riskManagement.maxPositionSize = 33
    wrapper.vm.methodology.entryRules.push({ type: 'price' })
    const before = wrapper.vm.savedMethodologies.length

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.savedMethodologies).toHaveLength(before + 1)
    const saved = wrapper.vm.savedMethodologies[before]
    expect(saved.id).toBe(new Date('2026-11-17T10:00:00.000Z').getTime())
    expect(saved.status).toBe('active')
    expect(wrapper.vm.methodology.name).toBe('')
    expect(wrapper.vm.methodology.entryRules).toEqual([])
    expect(wrapper.vm.methodology.riskManagement.maxPositionSize).toBe(33)
    expect(wrapper.vm.currentStep).toBe(0)

    vi.useRealTimers()
  })

  it('deleteMethodology só remove após confirm verdadeiro e compara id estrito', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const before = wrapper.vm.savedMethodologies.length

    wrapper.vm.deleteMethodology(wrapper.vm.savedMethodologies[0])
    expect(wrapper.vm.savedMethodologies).toHaveLength(before)

    confirmSpy.mockReturnValue(true)
    wrapper.vm.deleteMethodology({ id: '1', name: 'Value Conservador' })
    expect(wrapper.vm.savedMethodologies).toHaveLength(before)

    wrapper.vm.deleteMethodology({ id: 1, name: 'Value Conservador' })
    expect(wrapper.vm.savedMethodologies).toHaveLength(before - 1)
    confirmSpy.mockRestore()
  })
})
