import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Hero from '@/components/Hero.vue'

const routes = [
  { path: '/', name: 'Home', component: { template: '<div />' } },
  { path: '/cadastro', name: 'Cadastro', component: { template: '<div>cadastro</div>' } },
  { path: '/login', name: 'Login', component: { template: '<div />' } }
]

describe('Hero — CTA de criação de conta', () => {
  let router

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    await router.push('/')
    await router.isReady()
    vi.spyOn(router, 'push')
  })

  it('o botão Criar sua conta não navega para /cadastro', async () => {
    const wrapper = mount(Hero, {
      global: { plugins: [router] }
    })

    expect(wrapper.text()).toContain('Criar sua conta')
    expect(wrapper.find('a[href="/cadastro"]').exists()).toBe(false)

    await wrapper.find('form.email-form').trigger('submit')

    expect(router.push).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('o e-mail digitado não é capturado (input sem v-model) e o submit não persiste o lead', async () => {
    const wrapper = mount(Hero, {
      global: { plugins: [router] }
    })

    const emailInput = wrapper.find('input[type="email"]')
    expect(emailInput.exists()).toBe(true)

    await emailInput.setValue('lead@email.com')

    expect(wrapper.vm).not.toHaveProperty('email')
    expect(Object.keys(wrapper.vm)).not.toContain('form')

    await wrapper.find('form.email-form').trigger('submit')

    expect(router.push).not.toHaveBeenCalled()
    expect(emailInput.element.value).toBe('lead@email.com')
  })
})
