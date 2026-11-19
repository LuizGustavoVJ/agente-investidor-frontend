import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'

describe('SearchBar — resultado sem navegação e busca só por name', () => {
  it('filtra por name, ignora type, e o item de resultado não tem click/to', async () => {
    const wrapper = mount(SearchBar)

    await wrapper.find('input').setValue('Ação')
    expect(wrapper.vm.results).toEqual([])

    await wrapper.find('input').setValue('petr')
    expect(wrapper.vm.results).toEqual([{ type: 'Ação', name: 'PETR4' }])

    const item = wrapper.find('.search-result-item')
    expect(item.exists()).toBe(true)
    expect(item.attributes('href')).toBeUndefined()
    expect(item.element.tagName).toBe('DIV')
    expect(item.find('a').exists()).toBe(false)
    wrapper.unmount()
  })

  it('onBlur esconde resultados só depois de 150ms — clique imediato ainda vê a lista', async () => {
    vi.useFakeTimers()
    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('VALE')
    expect(wrapper.vm.showResults).toBe(true)

    await wrapper.find('input').trigger('blur')
    expect(wrapper.vm.showResults).toBe(true)
    vi.advanceTimersByTime(149)
    expect(wrapper.vm.showResults).toBe(true)
    vi.advanceTimersByTime(1)
    expect(wrapper.vm.showResults).toBe(false)
    vi.useRealTimers()
    wrapper.unmount()
  })
})
