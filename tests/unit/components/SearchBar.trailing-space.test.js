import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'

describe('SearchBar — busca com espaço no fim não encontra o ativo', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(SearchBar)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('query "PETR4 " (espaço no fim) não retorna PETR4', async () => {
    wrapper.vm.query = 'PETR4 '
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.results).toEqual([])
    expect(wrapper.vm.showResults).toBe(true)
  })

  it('query "PETR4" sem espaço encontra o ativo', async () => {
    wrapper.vm.query = 'PETR4'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.results.map((item) => item.name)).toEqual(['PETR4'])
  })
})
