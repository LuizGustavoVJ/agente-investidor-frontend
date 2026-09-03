import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Login from '@/components/Login.vue'
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
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'Login', component: Login },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/metas', name: 'Metas', component: { template: '<div>Metas</div>' } },
    { path: '/cadastro', name: 'Cadastro', component: { template: '<div>Cadastro</div>' } },
    { path: '/recuperar-senha', name: 'RecuperarSenha', component: { template: '<div>Recuperar</div>' } }
  ]
})

describe('Login — fluxo de autenticação', () => {
  let wrapper
  let pinia
  let authStore

  const mountLogin = async (query = {}) => {
    await router.push({ name: 'Login', query })
    await router.isReady()

    wrapper = mount(Login, {
      global: {
        plugins: [pinia, router],
        stubs: {
          'router-link': {
            props: ['to'],
            template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>'
          }
        }
      }
    })
    await wrapper.vm.$nextTick()
  }

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('mantém o botão desabilitado até email válido e senha com 6+ caracteres', async () => {
    await mountLogin()
    const submit = wrapper.find('button.login-button')
    expect(submit.attributes('disabled')).toBeDefined()

    await wrapper.find('#email').setValue('invalido')
    await wrapper.find('#password').setValue('123456')
    expect(wrapper.find('button.login-button').attributes('disabled')).toBeDefined()

    await wrapper.find('#email').setValue('user@email.com')
    await wrapper.find('#password').setValue('12345')
    expect(wrapper.find('button.login-button').attributes('disabled')).toBeDefined()

    await wrapper.find('#password').setValue('123456')
    expect(wrapper.find('button.login-button').attributes('disabled')).toBeUndefined()
  })

  it('valida email e senha no submit mesmo com campos incompletos', async () => {
    await mountLogin()

    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Email é obrigatório')
    expect(wrapper.text()).toContain('Senha é obrigatória')

    await wrapper.find('#email').setValue('sem-arroba')
    await wrapper.find('#password').setValue('123')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Email deve ser válido')
    expect(wrapper.text()).toContain('Senha deve ter pelo menos 6 caracteres')
  })

  it('envia credenciais e rememberMe para a store', async () => {
    await mountLogin()
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue({ success: true })

    await wrapper.find('#email').setValue('user@email.com')
    await wrapper.find('#password').setValue('senha123')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'user@email.com',
      password: 'senha123',
      rememberMe: true
    })
  })

  it('redireciona para /dashboard após login bem-sucedido', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    await mountLogin()
    vi.spyOn(authStore, 'login').mockResolvedValue({ success: true })

    await wrapper.find('#email').setValue('user@email.com')
    await wrapper.find('#password').setValue('senha123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockToast.success).toHaveBeenCalledWith('Login realizado com sucesso!')
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('respeita o query redirect após login', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    await mountLogin({ redirect: '/metas' })
    vi.spyOn(authStore, 'login').mockResolvedValue({ success: true })

    await wrapper.find('#email').setValue('user@email.com')
    await wrapper.find('#password').setValue('senha123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith('/metas')
  })

  it('mostra toast de erro quando a store recusa o login', async () => {
    await mountLogin()
    vi.spyOn(authStore, 'login').mockResolvedValue({
      success: false,
      error: 'Credenciais inválidas'
    })

    await wrapper.find('#email').setValue('user@email.com')
    await wrapper.find('#password').setValue('senha123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Credenciais inválidas')
    expect(mockToast.success).not.toHaveBeenCalled()
  })

  it('alterna visibilidade da senha', async () => {
    await mountLogin()
    const toggle = wrapper.find('.password-toggle')

    expect(wrapper.find('#password').attributes('type')).toBe('password')
    await toggle.trigger('click')
    expect(wrapper.find('#password').attributes('type')).toBe('text')
    await toggle.trigger('click')
    expect(wrapper.find('#password').attributes('type')).toBe('password')
  })

  it('pré-preenche o email vindo da query string', async () => {
    await mountLogin({ email: 'preenchido@email.com' })
    expect(wrapper.find('#email').element.value).toBe('preenchido@email.com')
  })

  it('desabilita o botão e mostra Entrando... durante o loading da store', async () => {
    await mountLogin()
    authStore.isLoading = true
    await wrapper.vm.$nextTick()

    const submit = wrapper.find('button.login-button')
    expect(submit.attributes('disabled')).toBeDefined()
    expect(submit.text()).toContain('Entrando...')
  })
})
