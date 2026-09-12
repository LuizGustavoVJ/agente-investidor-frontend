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

describe('Cadastro — validação de e-mail e nome', () => {
  let wrapper
  let pinia
  let authStore

  const fillRequired = async ({
    name = 'Maria Silva',
    email = 'maria@email.com',
    password = 'Senha123',
    confirmPassword = 'Senha123',
    acceptTerms = true
  } = {}) => {
    await wrapper.find('#name').setValue(name)
    await wrapper.find('#email').setValue(email)
    await wrapper.find('#password').setValue(password)
    await wrapper.find('#confirmPassword').setValue(confirmPassword)
    if (acceptTerms) {
      await wrapper.find('input[type="checkbox"]').setValue(true)
    }
    await wrapper.vm.$nextTick()
  }

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/cadastro', name: 'Cadastro', component: Cadastro },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
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
    await wrapper.vm.$nextTick()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('considera válido o e-mail a@ — mais fraco que Configurações (\\S+@\\S+\\.\\S+)', async () => {
    await fillRequired({ email: 'a@' })

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(true)
    expect(/\S+@\S+\.\S+/.test('a@')).toBe(false)
  })

  it('habilita o botão com nome só de espaços; validateForm recusa no submit', async () => {
    await fillRequired({ name: '   ' })

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.find('.cadastro-button').attributes('disabled')).toBeUndefined()
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.name).toBe('Nome é obrigatório')
  })

  it('faz trim do e-mail no submit — diferente do Login, que envia a query crua', async () => {
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue({ success: false })
    await fillRequired()
    wrapper.vm.form.email = '  maria@email.com  '
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isFormValid).toBe(true)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'maria@email.com' })
    )
  })
})
