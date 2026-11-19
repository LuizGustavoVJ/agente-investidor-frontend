import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Cadastro — termos, espaços e marketing', () => {
  let router
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/cadastro', component: { template: '<div />' } },
        { path: '/dashboard', component: { template: '<div />' } },
        { path: '/login', component: { template: '<div />' } }
      ]
    })
    await router.push('/cadastro')
    await router.isReady()
  })

  const mountCadastro = () => mount(Cadastro, {
    global: {
      plugins: [pinia, router],
      stubs: { 'router-link': true }
    }
  })

  it('isFormValid exige acceptTerms, mas validateForm não — submit passa sem termos', async () => {
    const wrapper = mountCadastro()
    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.password = 'Senha123'
    wrapper.vm.form.confirmPassword = 'Senha123'
    wrapper.vm.form.acceptTerms = false
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isFormValid).toBe(false)
    expect(wrapper.vm.validateForm()).toBe(true)
    wrapper.unmount()
  })

  it('nome só com espaços habilita isFormValid mas validateForm rejeita', async () => {
    const wrapper = mountCadastro()
    wrapper.vm.form.name = '  '
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.password = 'Senha1234'
    wrapper.vm.form.confirmPassword = 'Senha1234'
    wrapper.vm.form.acceptTerms = true
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.name).toBe('Nome é obrigatório')
    wrapper.unmount()
  })

  it('handleRegister envia acceptMarketing à store; o client.post da API não inclui o campo', async () => {
    const wrapper = mountCadastro()
    const store = useAuthStore()
    const registerSpy = vi.spyOn(store, 'register')
    vi.spyOn(authAPI, 'register').mockImplementation(async (userData) => {
      expect(userData.acceptMarketing).toBe(true)
      return { data: { success: false, message: 'email in use' } }
    })

    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.email = 'ana@ex.com'
    wrapper.vm.form.phone = '(11) 99999-9999'
    wrapper.vm.form.password = 'Senha1234'
    wrapper.vm.form.confirmPassword = 'Senha1234'
    wrapper.vm.form.acceptTerms = true
    wrapper.vm.form.acceptMarketing = true
    await wrapper.vm.handleRegister()
    await flushPromises()

    expect(registerSpy).toHaveBeenCalledWith(expect.objectContaining({
      acceptTerms: true,
      acceptMarketing: true
    }))
    wrapper.unmount()
  })

  it('força da senha "Senha123" fica abaixo de muito forte — falta símbolo', async () => {
    const wrapper = mountCadastro()
    wrapper.vm.form.password = 'Senha123'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.passwordStrength.class).not.toBe('very-strong')
    expect(wrapper.vm.passwordStrength.text).toMatch(/símbolos/i)
    wrapper.unmount()
  })

  it('watch de telefone com 12 dígitos não reescreve — dígito extra permanece', async () => {
    const wrapper = mountCadastro()
    wrapper.vm.form.phone = '119999999999'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.form.phone).toBe('119999999999')
    wrapper.unmount()
  })
})
