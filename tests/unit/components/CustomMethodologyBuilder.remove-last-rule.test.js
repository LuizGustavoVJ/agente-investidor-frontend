import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — última regra de entrada e save sem validar', () => {
  let wrapper
  let alertSpy

  beforeEach(() => {
    setActivePinia(createPinia())
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    alertSpy?.mockRestore()
  })

  it('removeRule consegue apagar a última regra de entrada e bloqueia o avanço', () => {
    wrapper.vm.currentStep = 2
    wrapper.vm.addRule('entry')
    wrapper.vm.addRule('entry')
    expect(wrapper.vm.methodology.entryRules).toHaveLength(2)

    wrapper.vm.removeRule('entry', 0)
    wrapper.vm.removeRule('entry', 0)

    expect(wrapper.vm.methodology.entryRules).toHaveLength(0)
    expect(wrapper.vm.canProceedToNextStep()).toBe(false)
    expect(wrapper.vm.isMethodologyValid).toBeFalsy()
  })

  it('getIndicatorsByType de tipo desconhecido devolve lista vazia', () => {
    expect(wrapper.vm.getIndicatorsByType('desconhecido')).toEqual([])
    expect(wrapper.vm.getIndicatorsByType('technical').length).toBeGreaterThan(0)
  })

  it('saveMethodology persiste mesmo sem nome, categoria nem regra de entrada', () => {
    const countBefore = wrapper.vm.savedMethodologies.length
    expect(wrapper.vm.isMethodologyValid).toBeFalsy()

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.savedMethodologies).toHaveLength(countBefore + 1)
    const saved = wrapper.vm.savedMethodologies[countBefore]
    expect(saved.name).toBe('')
    expect(saved.entryRules).toEqual([])
    expect(saved.status).toBe('active')
    expect(alertSpy).toHaveBeenCalledWith('Metodologia salva com sucesso!')
  })
})
