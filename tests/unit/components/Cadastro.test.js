import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/cadastro', name: 'Cadastro', component: Cadastro },
    { path: '/termos', name: 'Termos', component: { template: '<div>Termos</div>' } },
    { path: '/privacidade', name: 'Privacidade', component: { template: '<div>Privacidade</div>' } }
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

const fillValidForm = async (wrapper) => {
  await wrapper.find('#name').setValue('Maria Silva')
  await wrapper.find('#email').setValue('maria@email.com')
  await wrapper.find('#password').setValue('SenhaForte1')
  await wrapper.find('#confirmPassword').setValue('SenhaForte1')
  await wrapper.find('input[type="checkbox"]').setValue(true)
}

describe('Cadastro', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()

    wrapper = mount(Cadastro, {
      global: {
        plugins: [router],
        stubs: {
          'router-link': true
        }
      }
    })

    await router.isReady()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('renderiza o formulário de cadastro', () => {
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('#name').exists()).toBe(true)
    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
    expect(wrapper.find('#confirmPassword').exists()).toBe(true)
    expect(wrapper.find('#phone').exists()).toBe(true)
  })

  it('mantém o botão de criar conta desabilitado até o formulário ser válido', async () => {
    const submit = wrapper.find('button[type="submit"]')
    expect(submit.attributes('disabled')).toBeDefined()

    await fillValidForm(wrapper)

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('rejeita nome vazio ou curto no submit', async () => {
    await wrapper.find('#name').setValue('A')
    await wrapper.find('#email').setValue('maria@email.com')
    await wrapper.find('#password').setValue('SenhaForte1')
    await wrapper.find('#confirmPassword').setValue('SenhaForte1')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Nome deve ter pelo menos 2 caracteres')
  })

  it('rejeita email sem @', async () => {
    await wrapper.find('#name').setValue('Maria Silva')
    await wrapper.find('#email').setValue('email-invalido')
    await wrapper.find('#password').setValue('SenhaForte1')
    await wrapper.find('#confirmPassword').setValue('SenhaForte1')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Email deve ser válido')
  })

  it('rejeita senha com menos de 8 caracteres', async () => {
    await wrapper.find('#name').setValue('Maria Silva')
    await wrapper.find('#email').setValue('maria@email.com')
    await wrapper.find('#password').setValue('curta')
    await wrapper.find('#confirmPassword').setValue('curta')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Senha deve ter pelo menos 8 caracteres')
  })

  it('rejeita confirmação de senha divergente', async () => {
    await wrapper.find('#name').setValue('Maria Silva')
    await wrapper.find('#email').setValue('maria@email.com')
    await wrapper.find('#password').setValue('SenhaForte1')
    await wrapper.find('#confirmPassword').setValue('OutraSenha1')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Senhas não coincidem')
  })

  it('aplica máscara de telefone brasileiro', async () => {
    await wrapper.find('#phone').setValue('11987654321')

    expect(wrapper.find('#phone').element.value).toBe('(11) 98765-4321')
  })

  it('rejeita telefone com formato inválido após máscara incompleta', async () => {
    await fillValidForm(wrapper)
    await wrapper.find('#phone').setValue('11')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Formato: (11) 99999-9999')
  })

  it('classifica força da senha de muito fraca até muito forte', async () => {
    const password = wrapper.find('#password')

    await password.setValue('abc')
    expect(wrapper.text()).toContain('Muito fraca')

    await password.setValue('abcdefgh')
    expect(wrapper.text()).toContain('Fraca')

    await password.setValue('Abcdefgh1')
    expect(wrapper.text()).toContain('Média')

    await password.setValue('Abcdefghijkl1')
    expect(wrapper.text()).toContain('Forte')

    await password.setValue('Abcdefghijkl1!')
    expect(wrapper.text()).toContain('Muito forte')
  })

  it('envia payload completo para a store e navega ao dashboard em sucesso', async () => {
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue({ success: true })
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue()

    await fillValidForm(wrapper)
    await wrapper.find('#phone').setValue('11987654321')

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy).toHaveBeenCalledWith({
      name: 'Maria Silva',
      email: 'maria@email.com',
      phone: '(11) 98765-4321',
      password: 'SenhaForte1',
      confirmPassword: 'SenhaForte1',
      acceptTerms: true,
      acceptMarketing: false
    })
    expect(mockToast.success).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('não chama a API quando a validação falha', async () => {
    const registerSpy = vi.spyOn(authStore, 'register')

    await wrapper.find('form').trigger('submit')

    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('mostra erro da store quando o cadastro falha', async () => {
    vi.spyOn(authStore, 'register').mockResolvedValue({
      success: false,
      error: 'Email já cadastrado'
    })

    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(mockToast.error).toHaveBeenCalledWith('Email já cadastrado')
  })

  it('alterna visibilidade da senha', async () => {
    const passwordInput = wrapper.find('#password')
    expect(passwordInput.attributes('type')).toBe('password')

    await wrapper.findAll('.password-toggle')[0].trigger('click')

    expect(wrapper.find('#password').attributes('type')).toBe('text')
  })
})
