import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — editar e salvar sempre faz append', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-13T10:00:00.000Z'))
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('edit+save reusa o id original e empurra um segundo card — Date.now() é sobrescrito', () => {
    const fixture = wrapper.vm.savedMethodologies.find((item) => item.id === 1)
    expect(wrapper.vm.savedMethodologies.filter((item) => item.id === 1)).toHaveLength(1)

    wrapper.vm.editMethodology(fixture)
    wrapper.vm.methodology.description = 'Value Conservador (editado)'
    wrapper.vm.saveMethodology()

    const duplicates = wrapper.vm.savedMethodologies.filter((item) => item.id === 1)
    expect(duplicates).toHaveLength(2)
    expect(duplicates.map((item) => item.description)).toEqual([
      'Estratégia focada em ações baratas com baixo risco',
      'Value Conservador (editado)'
    ])
    expect(duplicates.every((item) => item.id !== Date.now())).toBe(true)
  })

  it('deleteMethodology só remove o primeiro id — o clone órfão continua publicado', () => {
    const fixture = wrapper.vm.savedMethodologies.find((item) => item.id === 1)
    wrapper.vm.editMethodology(fixture)
    wrapper.vm.saveMethodology()

    expect(wrapper.vm.savedMethodologies.filter((item) => item.id === 1)).toHaveLength(2)

    wrapper.vm.deleteMethodology({ id: 1, name: 'Value Conservador' })

    const remaining = wrapper.vm.savedMethodologies.filter((item) => item.id === 1)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(1)
    expect(remaining[0].name).toBe('Value Conservador')
    expect(window.confirm).toHaveBeenCalled()
  })
})
