import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/dashboard', component: { template: '<div />' } },
    { path: '/login', component: { template: '<div />' } }
  ]
})

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Cadastro — validação e registro', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    vi.clearAllMocks()

    wrapper = mount(Cadastro, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    await router.isReady()
  })

  const fillValidForm = async (overrides = {}) => {
    Object.assign(wrapper.vm.form, {
      name: 'Ana Souza',
      email: 'ana@ex.com',
      phone: '(11) 99999-9999',
      password: 'Senha123!',
      confirmPassword: 'Senha123!',
      acceptTerms: true,
      acceptMarketing: false,
      ...overrides
    })
    await wrapper.vm.$nextTick()
  }

  it('isFormValid e validateForm aceitam e-mail só com @, sem exigir domínio', async () => {
    await fillValidForm({ email: 'sem-dominio@' })

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(true)
    expect(wrapper.vm.errors.email).toBe('')
  })

  it('máscara formata 11 dígitos e rejeita telefone com 12 dígitos que não entra na máscara', async () => {
    await fillValidForm({ phone: '11988887777' })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.form.phone).toBe('(11) 98888-7777')
    expect(wrapper.vm.validateForm()).toBe(true)

    wrapper.vm.form.phone = '119888877770'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.form.phone).toBe('119888877770')
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.phone).toBe('Formato: (11) 99999-9999')
  })

  it('rejeita senhas diferentes e nome com um caractere', async () => {
    await fillValidForm({ name: 'A', confirmPassword: 'outra' })

    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.name).toBe('Nome deve ter pelo menos 2 caracteres')
    expect(wrapper.vm.errors.confirmPassword).toBe('Senhas não coincidem')
  })

  it('não chama register se o telefone tiver dígito a mais fora da máscara', async () => {
    const registerSpy = vi.spyOn(authStore, 'register')
    await fillValidForm({ phone: '119999999999' })
    await wrapper.vm.$nextTick()

    await wrapper.vm.handleRegister()

    expect(registerSpy).not.toHaveBeenCalled()
    expect(mockToast.success).not.toHaveBeenCalled()
  })

  it('envia acceptMarketing e telefone trimado no registro válido', async () => {
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue({ success: true })
    const pushSpy = vi.spyOn(router, 'push')
    await fillValidForm({
      name: '  Ana Souza  ',
      email: '  ana@ex.com  ',
      phone: '(11) 98888-7777',
      acceptMarketing: true
    })

    await wrapper.vm.handleRegister()

    expect(registerSpy).toHaveBeenCalledWith({
      name: 'Ana Souza',
      email: 'ana@ex.com',
      phone: '(11) 98888-7777',
      password: 'Senha123!',
      confirmPassword: 'Senha123!',
      acceptTerms: true,
      acceptMarketing: true
    })
    expect(mockToast.success).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('passwordStrength pontua símbolo e chega a muito forte', async () => {
    await fillValidForm({ password: 'Abcdefghi12!' })

    expect(wrapper.vm.passwordStrength.class).toBe('very-strong')
    expect(wrapper.vm.passwordStrength.percentage).toBe(100)
  })

  it('bloqueia submit sem aceite dos termos mesmo com o restante válido', async () => {
    await fillValidForm({ acceptTerms: false })

    expect(wrapper.vm.isFormValid).toBe(false)
    expect(wrapper.find('.cadastro-button').attributes('disabled')).toBeDefined()
  })
})
