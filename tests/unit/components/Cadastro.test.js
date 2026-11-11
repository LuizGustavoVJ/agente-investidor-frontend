import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

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
    { path: '/', name: 'Home', component: { template: '<div />' } },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
    { path: '/login', name: 'Login', component: { template: '<div />' } }
  ]
})

describe('Cadastro', () => {
  let wrapper
  let authStore

  const mountCadastro = async () => {
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
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    await mountCadastro()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  const fillValidForm = async (overrides = {}) => {
    wrapper.vm.form.name = 'Maria Silva'
    wrapper.vm.form.email = 'maria@test.com'
    wrapper.vm.form.password = 'SenhaForte1'
    wrapper.vm.form.confirmPassword = 'SenhaForte1'
    wrapper.vm.form.acceptTerms = true
    Object.assign(wrapper.vm.form, overrides)
    await wrapper.vm.$nextTick()
  }

  describe('validação do formulário', () => {
    it('recusa envio com nome curto e não chama a store', async () => {
      const registerSpy = vi.spyOn(authStore, 'register')
      await fillValidForm({ name: 'A' })

      await wrapper.vm.handleRegister()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.errors.name).toBe('Nome deve ter pelo menos 2 caracteres')
      expect(registerSpy).not.toHaveBeenCalled()
    })

    it('recusa email sem @', async () => {
      await fillValidForm({ email: 'email-invalido' })
      await wrapper.vm.handleRegister()

      expect(wrapper.vm.errors.email).toBe('Email deve ser válido')
    })

    it('recusa senhas diferentes', async () => {
      await fillValidForm({ confirmPassword: 'outra' })
      await wrapper.vm.handleRegister()

      expect(wrapper.vm.errors.confirmPassword).toBe('Senhas não coincidem')
    })

    it('recusa senha com menos de 8 caracteres', async () => {
      await fillValidForm({ password: 'curta1', confirmPassword: 'curta1' })
      await wrapper.vm.handleRegister()

      expect(wrapper.vm.errors.password).toBe('Senha deve ter pelo menos 8 caracteres')
    })

    it('recusa telefone incompleto mesmo após a máscara', async () => {
      await fillValidForm({ phone: '119999' })
      await wrapper.vm.$nextTick()
      await wrapper.vm.handleRegister()

      expect(wrapper.vm.form.phone).toBe('(11) 9999')
      expect(wrapper.vm.errors.phone).toBe('Formato: (11) 99999-9999')
    })

    it('isFormValid exige termos aceitos e senhas iguais', async () => {
      await fillValidForm({ acceptTerms: false })
      expect(wrapper.vm.isFormValid).toBe(false)

      await fillValidForm({ acceptTerms: true })
      expect(wrapper.vm.isFormValid).toBe(true)
    })
  })

  describe('força da senha', () => {
    it('classifica senha vazia, fraca e muito forte', async () => {
      wrapper.vm.form.password = ''
      expect(wrapper.vm.passwordStrength).toEqual({ percentage: 0, text: '', class: '' })

      wrapper.vm.form.password = 'abc'
      expect(wrapper.vm.passwordStrength.class).toBe('very-weak')
      expect(wrapper.vm.passwordStrength.text).toContain('Muito fraca')

      wrapper.vm.form.password = 'Abcdef12!xyz'
      expect(wrapper.vm.passwordStrength.class).toBe('very-strong')
      expect(wrapper.vm.passwordStrength.percentage).toBe(100)
    })
  })

  describe('máscara de telefone', () => {
    it('formata celular com 11 dígitos', async () => {
      const phoneInput = wrapper.find('#phone')
      await phoneInput.setValue('11987654321')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.form.phone).toBe('(11) 98765-4321')
    })
  })

  describe('submissão', () => {
    it('envia dados trimados e redireciona ao dashboard no sucesso', async () => {
      const pushSpy = vi.spyOn(router, 'push')
      vi.spyOn(authStore, 'register').mockResolvedValue({ success: true })
      await fillValidForm({
        name: '  Maria Silva  ',
        email: '  maria@test.com  ',
        phone: '(11) 98765-4321'
      })

      await wrapper.vm.handleRegister()
      await wrapper.vm.$nextTick()

      expect(authStore.register).toHaveBeenCalledWith({
        name: 'Maria Silva',
        email: 'maria@test.com',
        phone: '(11) 98765-4321',
        password: 'SenhaForte1',
        confirmPassword: 'SenhaForte1',
        acceptTerms: true,
        acceptMarketing: false
      })
      expect(mockToast.success).toHaveBeenCalled()
      expect(pushSpy).toHaveBeenCalledWith('/dashboard')
    })

    it('mostra toast de erro quando a store recusa o cadastro', async () => {
      vi.spyOn(authStore, 'register').mockResolvedValue({
        success: false,
        error: 'Email já cadastrado'
      })
      await fillValidForm()

      await wrapper.vm.handleRegister()
      await wrapper.vm.$nextTick()

      expect(mockToast.error).toHaveBeenCalledWith('Email já cadastrado')
    })
  })
})
