import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'

describe('SearchBar', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(SearchBar)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('filtra ativos de forma case-insensitive enquanto o usuário digita', async () => {
    const input = wrapper.find('input[type="text"]')
    await input.setValue('petr')

    expect(wrapper.findAll('.search-result-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('PETR4')
    expect(wrapper.text()).toContain('Ação')
  })

  it('não mostra resultados para consulta só com espaços', async () => {
    await wrapper.find('input[type="text"]').setValue('   ')

    expect(wrapper.find('.search-results').exists()).toBe(false)
  })

  it('esvazia resultados quando a busca é apagada', async () => {
    await wrapper.find('input[type="text"]').setValue('VALE')
    expect(wrapper.findAll('.search-result-item').length).toBeGreaterThan(0)

    await wrapper.find('input[type="text"]').setValue('')
    expect(wrapper.find('.search-results').exists()).toBe(false)
  })

  it('mantém múltiplos tipos de resultado (fundo, relatório, carteira)', async () => {
    await wrapper.find('input[type="text"]').setValue('carteira')
    expect(wrapper.text()).toContain('Carteira Dividendos')
    expect(wrapper.text()).toContain('Carteira')
  })

  it('esconde o dropdown no blur após o delay', async () => {
    vi.useFakeTimers()
    await wrapper.find('input[type="text"]').setValue('PETR')
    expect(wrapper.find('.search-results').exists()).toBe(true)

    await wrapper.find('input[type="text"]').trigger('blur')
    await vi.advanceTimersByTimeAsync(150)

    expect(wrapper.find('.search-results').exists()).toBe(false)
    vi.useRealTimers()
  })
})
