import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SearchBar from '@/components/SearchBar.vue'

describe('SearchBar — resultados mock sem navegação', () => {
  let wrapper
  let router

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div />' } },
        { path: '/portfolio', name: 'Portfolio', component: { template: '<div />' } },
        { path: '/analises', name: 'Analises', component: { template: '<div />' } }
      ]
    })
    await router.push('/')
    await router.isReady()

    wrapper = mount(SearchBar, {
      global: { plugins: [router] }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('PETR filtra o mock e o clique no resultado não navega', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    const input = wrapper.find('input')

    await input.setValue('PETR')
    await flushPromises()

    const items = wrapper.findAll('.search-result-item')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('PETR4')
    expect(items[0].text()).toContain('Ação')

    await items[0].trigger('click')
    await flushPromises()

    expect(pushSpy).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.vm.query).toBe('PETR')
    expect(wrapper.vm.results).toEqual([{ type: 'Ação', name: 'PETR4' }])
  })

  it('WEGE3 (ativo real fora do mock) não aparece — busca não chama API', async () => {
    await wrapper.find('input').setValue('WEGE3')
    await flushPromises()

    expect(wrapper.vm.results).toEqual([])
    expect(wrapper.findAll('.search-result-item')).toHaveLength(0)
    expect(wrapper.find('.search-results').exists()).toBe(false)
  })

  it('itens do dropdown não são links e não têm handler de clique', () => {
    const source = SearchBar
    const render = typeof source.render === 'function' ? String(source.render) : ''
    const compiled = JSON.stringify(source)

    expect(compiled.includes('router-link') || render.includes('router-link')).toBe(false)
    expect(wrapper.vm.onSelect || wrapper.vm.openResult || wrapper.vm.goToAsset).toBeFalsy()
  })
})
