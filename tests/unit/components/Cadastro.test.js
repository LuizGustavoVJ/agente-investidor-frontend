import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/dashboard', name: 'dashboard', component: { template: '<div />' } }
  ]
})

describe('Cadastro — validação de dados e força de senha', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    wrapper = mount(Cadastro, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    await router.isReady()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('formulario começa inválido', () => {
    expect(wrapper.vm.isFormValid).toBeFalsy()
  })

  it('exige termos, senha longa e confirmação igual', async () => {
    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.email = 'ana@email.com'
    wrapper.vm.form.password = 'Senha123'
    wrapper.vm.form.confirmPassword = 'Senha123'
    wrapper.vm.form.acceptTerms = false
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isFormValid).toBeFalsy()

    wrapper.vm.form.acceptTerms = true
    wrapper.vm.form.password = 'curta'
    wrapper.vm.form.confirmPassword = 'curta'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isFormValid).toBeFalsy()

    wrapper.vm.form.password = 'Senha123'
    wrapper.vm.form.confirmPassword = 'Senha123'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isFormValid).toBeTruthy()
  })

  it('validateForm cobre nome, email, telefone e senhas', () => {
    wrapper.vm.form.name = 'A'
    wrapper.vm.form.email = 'invalido'
    wrapper.vm.form.phone = '11999999999'
    wrapper.vm.form.password = '123'
    wrapper.vm.form.confirmPassword = '456'

    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.name).toBe('Nome deve ter pelo menos 2 caracteres')
    expect(wrapper.vm.errors.email).toBe('Email deve ser válido')
    expect(wrapper.vm.errors.phone).toBe('Formato: (11) 99999-9999')
    expect(wrapper.vm.errors.password).toBe('Senha deve ter pelo menos 8 caracteres')
    expect(wrapper.vm.errors.confirmPassword).toBe('Senhas não coincidem')
  })

  it('aceita telefone no formato mascarado', () => {
    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.email = 'ana@email.com'
    wrapper.vm.form.phone = '(11) 99999-8888'
    wrapper.vm.form.password = 'Senha123'
    wrapper.vm.form.confirmPassword = 'Senha123'

    expect(wrapper.vm.validateForm()).toBe(true)
  })

  it('validateForm não exige acceptTerms — só o botão trava o consentimento', () => {
    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.email = 'ana@email.com'
    wrapper.vm.form.phone = ''
    wrapper.vm.form.password = 'Senha123'
    wrapper.vm.form.confirmPassword = 'Senha123'
    wrapper.vm.form.acceptTerms = false

    expect(wrapper.vm.validateForm()).toBe(true)
    expect(wrapper.vm.isFormValid).toBeFalsy()
  })

  it('classifica força da senha por critérios cumulativos', async () => {
    wrapper.vm.form.password = ''
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.passwordStrength.percentage).toBe(0)

    wrapper.vm.form.password = 'abcdefgh'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.passwordStrength.class).toBe('weak')

    wrapper.vm.form.password = 'Abcdefghij1!'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.passwordStrength.class).toBe('very-strong')
    expect(wrapper.vm.passwordStrength.percentage).toBe(100)
  })

  it('aplica máscara de telefone ao digitar apenas números', async () => {
    wrapper.vm.form.phone = '11987654321'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.form.phone).toBe('(11) 98765-4321')
  })

  it('não chama register quando a validação falha', async () => {
    const registerSpy = vi.spyOn(authStore, 'register')

    await wrapper.vm.handleRegister()

    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('envia dados aparados para a store em cadastro válido', async () => {
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue({ success: true })
    wrapper.vm.form.name = '  Ana Silva  '
    wrapper.vm.form.email = '  ana@email.com  '
    wrapper.vm.form.phone = '(11) 99999-8888'
    wrapper.vm.form.password = 'Senha123'
    wrapper.vm.form.confirmPassword = 'Senha123'
    wrapper.vm.form.acceptTerms = true
    wrapper.vm.form.acceptMarketing = true

    await wrapper.vm.handleRegister()

    expect(registerSpy).toHaveBeenCalledWith({
      name: 'Ana Silva',
      email: 'ana@email.com',
      phone: '(11) 99999-8888',
      password: 'Senha123',
      confirmPassword: 'Senha123',
      acceptTerms: true,
      acceptMarketing: true
    })
  })
})
