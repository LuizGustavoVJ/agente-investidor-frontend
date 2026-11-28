import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder: clonar e salvar grava id undefined', () => {
  let wrapper
  let alertSpy
  let confirmSpy

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
    alertSpy.mockRestore()
    confirmSpy.mockRestore()
  })

  it('cloneMethodology define id:undefined; saveMethodology espalha isso por cima de Date.now()', () => {
    const original = wrapper.vm.savedMethodologies[0]
    expect(original.id).toBe(1)

    wrapper.vm.cloneMethodology(original)
    expect(wrapper.vm.methodology.name).toBe('Value Conservador (Cópia)')
    expect(wrapper.vm.methodology.id).toBeUndefined()

    wrapper.vm.saveMethodology()

    const saved = wrapper.vm.savedMethodologies[wrapper.vm.savedMethodologies.length - 1]
    expect(saved.id).toBeUndefined()
    expect(saved.name).toBe('Value Conservador (Cópia)')
    expect(saved.status).toBe('active')
    expect(alertSpy).toHaveBeenCalled()
  })

  it('deleteMethodology com id undefined remove o primeiro item que também não tem id', () => {
    wrapper.vm.savedMethodologies = [
      { id: undefined, name: 'Cópia órfã' },
      { id: 2, name: 'Growth Agressivo' }
    ]

    wrapper.vm.deleteMethodology({ id: undefined, name: 'outra' })

    expect(wrapper.vm.savedMethodologies).toHaveLength(1)
    expect(wrapper.vm.savedMethodologies[0].name).toBe('Growth Agressivo')
  })
})
