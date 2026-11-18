import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'

describe('SearchBar — matching e estados vazios', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = mount(SearchBar)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('busca é case-insensitive pelo name', async () => {
    const input = wrapper.find('input')
    await input.setValue('petr4')

    expect(wrapper.vm.results).toEqual([{ type: 'Ação', name: 'PETR4' }])
    expect(wrapper.vm.showResults).toBe(true)
  })

  it('não busca pelo type — "Ação" não retorna PETR4', async () => {
    await wrapper.find('input').setValue('Ação')
    expect(wrapper.vm.results).toEqual([])
  })

  it('query só com espaços esconde resultados', async () => {
    await wrapper.find('input').setValue('PETR4')
    expect(wrapper.vm.results).toHaveLength(1)

    await wrapper.find('input').setValue('   ')
    expect(wrapper.vm.results).toEqual([])
    expect(wrapper.vm.showResults).toBe(false)
  })

  it('onSearch com vazio limpa resultados', async () => {
    wrapper.vm.query = ''
    wrapper.vm.onSearch()
    expect(wrapper.vm.results).toEqual([])
    expect(wrapper.vm.showResults).toBe(false)
  })

  it('onBlur esconde resultados só depois de 150ms', async () => {
    await wrapper.find('input').setValue('VALE3')
    expect(wrapper.vm.showResults).toBe(true)

    wrapper.vm.onBlur()
    expect(wrapper.vm.showResults).toBe(true)

    await vi.advanceTimersByTimeAsync(150)
    expect(wrapper.vm.showResults).toBe(false)
  })
})
