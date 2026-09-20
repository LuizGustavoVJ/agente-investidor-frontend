import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — critério sem operators', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
    window.alert.mockRestore?.()
    window.confirm.mockRestore?.()
  })

  it('toggleCriterion lança se o critério não tiver operators', () => {
    expect(() =>
      wrapper.vm.toggleCriterion({ id: 'custom_score', hasWeight: true })
    ).toThrow(TypeError)
  })

  it('toggleCriterion lança se operators estiver vazio (operators[0] é undefined)', () => {
    expect(() =>
      wrapper.vm.toggleCriterion({
        id: 'empty_ops',
        operators: [],
        hasWeight: false
      })
    ).toThrow(TypeError)
  })

  it('getOperatorLabel de critério desconhecido devolve string vazia', () => {
    expect(wrapper.vm.getOperatorLabel('missing', 'gt')).toBe('')
  })
})
