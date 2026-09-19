import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'

describe('SearchBar — filtro só por name', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(SearchBar)
  })

  it('busca por tipo "Ação" não retorna PETR4 nem VALE3', async () => {
    const input = wrapper.find('input')
    await input.setValue('Ação')

    expect(wrapper.findAll('.search-result-item')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('PETR4')
    expect(wrapper.text()).not.toContain('VALE3')
  })

  it('busca por name parcial ainda encontra o ativo', async () => {
    const input = wrapper.find('input')
    await input.setValue('PETR')

    expect(wrapper.text()).toContain('PETR4')
    expect(wrapper.text()).toContain('Ação')
  })
})
