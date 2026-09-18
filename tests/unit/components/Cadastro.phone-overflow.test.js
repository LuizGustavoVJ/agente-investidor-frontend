import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

describe('Cadastro — 12º dígito da máscara de telefone', () => {
  let wrapper
  let router

  const fillRequiredFields = async () => {
    await wrapper.get('#name').setValue('Maria Silva')
    await wrapper.get('#email').setValue('maria@email.com')
    await wrapper.get('#password').setValue('SenhaForte1')
    await wrapper.get('#confirmPassword').setValue('SenhaForte1')
    const termsCheckbox = wrapper.findAll('input[type="checkbox"]')[0]
    await termsCheckbox.setValue(true)
  }

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/cadastro', name: 'Cadastro', component: Cadastro },
        { path: '/login', name: 'Login', component: { template: '<div />' } },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
      ]
    })
    await router.push('/cadastro')
    await router.isReady()

    wrapper = mount(Cadastro, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('formata celular com 11 dígitos e ignora o 12º (não reaplica a máscara)', async () => {
    await wrapper.get('#phone').setValue('11987654321')
    expect(wrapper.vm.form.phone).toBe('(11) 98765-4321')

    await wrapper.get('#phone').setValue('119876543210')

    expect(wrapper.vm.form.phone).toBe('119876543210')
    expect(wrapper.vm.form.phone).not.toMatch(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
  })

  it('validateForm recusa o telefone quando o 12º dígito fica no campo', async () => {
    await fillRequiredFields()
    await wrapper.get('#phone').setValue('119876543210')

    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.phone).toBe('Formato: (11) 99999-9999')
  })

  it('colar um dígito extra em telefone já mascarado também falha a validação', async () => {
    await fillRequiredFields()
    await wrapper.get('#phone').setValue('(11) 98765-43210')

    expect(wrapper.vm.form.phone).toBe('(11) 98765-43210')
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.phone).toBe('Formato: (11) 99999-9999')
  })
})
