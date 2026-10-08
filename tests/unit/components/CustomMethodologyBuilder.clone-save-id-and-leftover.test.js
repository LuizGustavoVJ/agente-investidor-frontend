import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — clone/edição corrompem identidade e regras', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('clone + save grava id undefined porque o spread sobrescreve Date.now()', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const original = wrapper.vm.savedMethodologies[0]
    const originalCount = wrapper.vm.savedMethodologies.length

    wrapper.vm.cloneMethodology(original)
    wrapper.vm.saveMethodology()

    const saved = wrapper.vm.savedMethodologies[wrapper.vm.savedMethodologies.length - 1]
    expect(wrapper.vm.savedMethodologies.length).toBe(originalCount + 1)
    expect(saved.id).toBeUndefined()
    expect(saved.id).not.toBe(1_700_000_000_000)
    expect(nowSpy).toHaveBeenCalled()
  })

  it('dois clones salvos compartilham id undefined e deleteMethodology remove só o primeiro', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const original = wrapper.vm.savedMethodologies[0]

    wrapper.vm.cloneMethodology(original)
    wrapper.vm.saveMethodology()
    wrapper.vm.cloneMethodology(original)
    wrapper.vm.saveMethodology()

    const clones = wrapper.vm.savedMethodologies.filter((m) => m.id === undefined)
    expect(clones.length).toBe(2)

    wrapper.vm.deleteMethodology(clones[1])
    const remainingUndefined = wrapper.vm.savedMethodologies.filter((m) => m.id === undefined)
    expect(remainingUndefined.length).toBe(1)
  })

  it('editMethodology não limpa entryRules deixadas no wizard — a estratégia salva herda regras de rascunho', () => {
    wrapper.vm.addRule('entry')
    wrapper.vm.methodology.entryRules[0].type = 'technical'
    wrapper.vm.methodology.entryRules[0].indicator = 'rsi'
    wrapper.vm.methodology.entryRules[0].value = '30'

    expect(wrapper.vm.methodology.entryRules).toHaveLength(1)

    const savedWithoutRules = wrapper.vm.savedMethodologies[0]
    expect(savedWithoutRules.entryRules).toBeUndefined()

    wrapper.vm.editMethodology(savedWithoutRules)

    expect(wrapper.vm.methodology.name).toBe('Value Conservador')
    expect(wrapper.vm.methodology.entryRules).toHaveLength(1)
    expect(wrapper.vm.methodology.entryRules[0].indicator).toBe('rsi')
  })

  it('regra de entrada em branco conta para canProceedToNextStep e isMethodologyValid', () => {
    wrapper.vm.methodology.name = 'Momentum'
    wrapper.vm.methodology.category = 'momentum'
    wrapper.vm.methodology.description = 'Compra rompimento'
    wrapper.vm.currentStep = 2

    expect(wrapper.vm.canProceedToNextStep()).toBe(false)

    wrapper.vm.addRule('entry')

    expect(wrapper.vm.methodology.entryRules[0]).toEqual({
      type: '',
      indicator: '',
      condition: '',
      value: '',
      description: ''
    })
    expect(wrapper.vm.canProceedToNextStep()).toBe(true)
    expect(wrapper.vm.isMethodologyValid).toBe(true)
  })
})
