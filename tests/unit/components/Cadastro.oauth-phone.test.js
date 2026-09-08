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
    { path: '/', name: 'Home', component: { template: '<div />' } },
    { path: '/cadastro', name: 'Cadastro', component: Cadastro },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
    { path: '/login', name: 'Login', component: { template: '<div />' } }
  ]
})

describe('Cadastro — OAuth, máscara de telefone e validade do botão', () => {
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

  it('OAuth Google/GitHub não chama register', async () => {
    const registerSpy = vi.spyOn(authStore, 'register')

    await wrapper.find('.oauth-button.google').trigger('click')
    await wrapper.find('.oauth-button.github').trigger('click')

    expect(registerSpy).not.toHaveBeenCalled()
    expect(mockToast.info).toHaveBeenCalledWith('Cadastro com Google em desenvolvimento')
    expect(mockToast.info).toHaveBeenCalledWith('Cadastro com GitHub em desenvolvimento')
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('aplica máscara de telefone fixo com 10 dígitos', async () => {
    await wrapper.find('#phone').setValue('1133334444')

    expect(wrapper.find('#phone').element.value).toBe('(11) 3333-4444')
  })

  it('habilita o submit com nome de 1 caractere, mas o validateForm recusa', async () => {
    await wrapper.find('#name').setValue('A')
    await wrapper.find('#email').setValue('a@email.com')
    await wrapper.find('#password').setValue('SenhaForte1')
    await wrapper.find('#confirmPassword').setValue('SenhaForte1')
    await wrapper.find('input[type="checkbox"]').setValue(true)

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.vm.validateForm()).toBe(false)
    expect(wrapper.vm.errors.name).toBe('Nome deve ter pelo menos 2 caracteres')
  })
})
