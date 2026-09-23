import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'
import { useAuthStore } from '@/stores/auth'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

function validPasswords(wrapper) {
  wrapper.vm.form.password = 'Senha123'
  wrapper.vm.form.confirmPassword = 'Senha123'
  wrapper.vm.form.email = 'ana@email.com'
  wrapper.vm.form.acceptTerms = true
}

describe('Cadastro — isFormValid aceita nome inválido que validateForm recusa', () => {
  let wrapper
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/cadastro', name: 'Cadastro', component: { template: '<div />' } },
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
    await flushPromises()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('nome só com espaços habilita o botão (truthy) mas validateForm barra', async () => {
    validPasswords(wrapper)
    wrapper.vm.form.name = '   '

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.name).toBe('Nome é obrigatório')
  })

  it('nome de 1 caractere habilita o botão mas validateForm exige 2', async () => {
    validPasswords(wrapper)
    wrapper.vm.form.name = 'A'

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.name).toBe('Nome deve ter pelo menos 2 caracteres')
  })

  it('telefone inválido não entra em isFormValid — o submit só cai no validateForm', async () => {
    validPasswords(wrapper)
    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.phone = '123'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.phone).toBe('Formato: (11) 99999-9999')
  })

  it('handleRegister com nome em branco não chama a API', async () => {
    const store = useAuthStore()
    store.register = vi.fn().mockResolvedValue({ success: true })

    validPasswords(wrapper)
    wrapper.vm.form.name = '   '

    await wrapper.vm.handleRegister()
    await flushPromises()

    expect(store.register).not.toHaveBeenCalled()
  })
})
