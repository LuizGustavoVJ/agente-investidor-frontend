import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Footer from '@/components/Footer.vue'

const routes = [
  { path: '/', name: 'Home', component: { template: '<div />' } },
  { path: '/termos', name: 'Termos', component: { template: '<div>termos</div>' } },
  { path: '/privacidade', name: 'Privacidade', component: { template: '<div>privacidade</div>' } }
]

describe('Footer — links legais', () => {
  it('Termos de Uso e Política de Privacidade apontam para # em vez das rotas legais', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(Footer, {
      global: { plugins: [router] }
    })

    const links = wrapper.findAll('nav a')
    expect(links).toHaveLength(2)
    expect(links[0].text()).toBe('Termos de Uso')
    expect(links[1].text()).toBe('Política de Privacidade')

    expect(links[0].attributes('href')).toBe('#')
    expect(links[1].attributes('href')).toBe('#')

    expect(wrapper.find('a[href="/termos"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/privacidade"]').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'RouterLink' }).exists()).toBe(false)
  })
})
