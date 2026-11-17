import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}
const mockPush = vi.fn()

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: {} })
}))

const { authAPI } = vi.hoisted(() => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

vi.mock('@/api/auth', () => ({ authAPI }))

import Cadastro from '@/components/Cadastro.vue'

const fillValidForm = (vm) => {
  vm.form.name = 'Ana Silva'
  vm.form.email = 'ana@ex.com'
  vm.form.password = 'Senha123'
  vm.form.confirmPassword = 'Senha123'
  vm.form.acceptTerms = true
}

describe('Cadastro — termos, nome e força de senha', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    authAPI.register.mockResolvedValue({ data: { success: true } })
    authAPI.login.mockResolvedValue({
      data: { success: true, user: { id: 1, email: 'ana@ex.com' } }
    })

    wrapper = mount(Cadastro, {
      global: {
        stubs: { 'router-link': true }
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('isFormValid exige termos, mas validateForm não', () => {
    fillValidForm(wrapper.vm)
    wrapper.vm.form.acceptTerms = false

    expect(wrapper.vm.isFormValid).toBe(false)
    expect(wrapper.vm.validateForm()).toBe(true)
  })

  it('handleRegister segue sem termos se validateForm passar', async () => {
    fillValidForm(wrapper.vm)
    wrapper.vm.form.acceptTerms = false

    await wrapper.vm.handleRegister()

    expect(authAPI.register).toHaveBeenCalled()
    expect(authAPI.register.mock.calls[0][0].acceptTerms).toBe(false)
  })

  it('rejeita nome com 1 caractere visível depois do trim', () => {
    fillValidForm(wrapper.vm)
    wrapper.vm.form.name = ' A '

    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.name).toBe('Nome deve ter pelo menos 2 caracteres')
  })

  it('isFormValid aceita senha de 8 sem símbolo; 7 caracteres não', () => {
    fillValidForm(wrapper.vm)
    wrapper.vm.form.password = '1234567'
    wrapper.vm.form.confirmPassword = '1234567'
    expect(wrapper.vm.isFormValid).toBe(false)

    wrapper.vm.form.password = '12345678'
    wrapper.vm.form.confirmPassword = '12345678'
    expect(wrapper.vm.isFormValid).toBe(true)
  })

  it('passwordStrength pontua símbolo e 12+ caracteres', () => {
    wrapper.vm.form.password = ''
    expect(wrapper.vm.passwordStrength.percentage).toBe(0)

    wrapper.vm.form.password = 'abcdefgh'
    expect(wrapper.vm.passwordStrength.percentage).toBe(35)
    expect(wrapper.vm.passwordStrength.class).toBe('weak')

    wrapper.vm.form.password = 'Abcdefgh12!'
    expect(wrapper.vm.passwordStrength.percentage).toBe(90)
    expect(wrapper.vm.passwordStrength.class).toBe('very-strong')
  })

  it('envia acceptMarketing para a store mesmo a API descartando o campo', async () => {
    fillValidForm(wrapper.vm)
    wrapper.vm.form.acceptMarketing = true
    wrapper.vm.form.phone = ''

    await wrapper.vm.handleRegister()

    expect(authAPI.register).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptMarketing: true,
        acceptTerms: true,
        name: 'Ana Silva'
      })
    )
  })
})
