import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'
import { useAuthStore } from '@/stores/auth'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Cadastro — máscara de telefone e termos fora do validateForm', () => {
  let wrapper
  let router
  let authStore
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/cadastro', component: { template: '<div />' } },
        { path: '/dashboard', component: { template: '<div />' } },
        { path: '/login', component: { template: '<div />' } },
        { path: '/termos', component: { template: '<div />' } },
        { path: '/privacidade', component: { template: '<div />' } }
      ]
    })
    await router.push('/cadastro')
    await router.isReady()

    wrapper = mount(Cadastro, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('máscara formata celular de 11 dígitos', async () => {
    const phone = wrapper.find('#phone')
    await phone.setValue('11987654321')
    expect(wrapper.vm.form.phone).toBe('(11) 98765-4321')
  })

  it('12 dígitos não recebem máscara e falham no regex de validateForm', async () => {
    wrapper.vm.form.phone = '119876543210'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.form.phone).toBe('119876543210')
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.phone).toBe('Formato: (11) 99999-9999')
  })

  it('validateForm não exige acceptTerms, mas isFormValid exige', () => {
    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.password = 'senha1234'
    wrapper.vm.form.confirmPassword = 'senha1234'
    wrapper.vm.form.acceptTerms = false

    expect(wrapper.vm.validateForm()).toBe(true)
    expect(wrapper.vm.isFormValid).toBe(false)
  })

  it('handleRegister envia acceptMarketing que a API depois descarta', async () => {
    const register = vi.spyOn(authStore, 'register').mockResolvedValue({ success: true })
    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.phone = '(11) 98765-4321'
    wrapper.vm.form.password = 'senha1234'
    wrapper.vm.form.confirmPassword = 'senha1234'
    wrapper.vm.form.acceptTerms = true
    wrapper.vm.form.acceptMarketing = true

    await wrapper.vm.handleRegister()

    expect(register).toHaveBeenCalledWith(expect.objectContaining({
      acceptTerms: true,
      acceptMarketing: true,
      phone: '(11) 98765-4321'
    }))
  })
})
