import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SearchBar from '@/components/SearchBar.vue'

describe('SearchBar — resultados sem navegação', () => {
  let wrapper
  let router
  let pushSpy

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
    pushSpy = vi.spyOn(router, 'push')

    wrapper = mount(SearchBar, {
      global: { plugins: [router] }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('item de resultado não é link e o clique não navega para o ativo', async () => {
    await wrapper.find('input[type="text"]').setValue('PETR4')

    const item = wrapper.find('.search-result-item')
    expect(item.exists()).toBe(true)
    expect(item.text()).toContain('PETR4')
    expect(item.element.tagName).toBe('DIV')
    expect(item.find('a').exists()).toBe(false)

    await item.trigger('click')

    expect(pushSpy).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('relatório e carteira também não disparam navegação', async () => {
    await wrapper.find('input[type="text"]').setValue('Relatório')
    const report = wrapper.findAll('.search-result-item')[0]
    expect(report.text()).toContain('Relatório Mensal')
    await report.trigger('click')
    expect(pushSpy).not.toHaveBeenCalled()

    await wrapper.find('input[type="text"]').setValue('Carteira')
    const wallet = wrapper.findAll('.search-result-item')[0]
    expect(wallet.text()).toContain('Carteira Dividendos')
    await wallet.trigger('click')
    expect(pushSpy).not.toHaveBeenCalled()
  })
})
