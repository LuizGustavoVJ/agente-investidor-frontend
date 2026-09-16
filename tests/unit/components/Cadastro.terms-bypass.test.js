import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
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

describe('Cadastro — termos aceitos só no botão, não na validação', () => {
  let wrapper
  let authStore
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/cadastro', component: Cadastro },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/termos', component: { template: '<div />' } },
        { path: '/privacidade', component: { template: '<div />' } }
      ]
    })

    wrapper = mount(Cadastro, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })

    await router.isReady()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('validateForm passa sem acceptTerms — só o botão exige o checkbox', () => {
    wrapper.vm.form.name = 'Maria Silva'
    wrapper.vm.form.email = 'maria@email.com'
    wrapper.vm.form.password = 'SenhaForte1'
    wrapper.vm.form.confirmPassword = 'SenhaForte1'
    wrapper.vm.form.acceptTerms = false

    expect(wrapper.vm.isFormValid).toBeFalsy()
    expect(wrapper.vm.validateForm()).toBe(true)
    expect(wrapper.vm.errors.name).toBe('')
    expect(wrapper.vm.errors.email).toBe('')
    expect(wrapper.vm.errors.password).toBe('')
  })

  it('handleRegister envia o cadastro mesmo com termos recusados', async () => {
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue({ success: true })
    vi.spyOn(router, 'push').mockResolvedValue()

    wrapper.vm.form.name = 'Maria Silva'
    wrapper.vm.form.email = 'maria@email.com'
    wrapper.vm.form.phone = ''
    wrapper.vm.form.password = 'SenhaForte1'
    wrapper.vm.form.confirmPassword = 'SenhaForte1'
    wrapper.vm.form.acceptTerms = false
    wrapper.vm.form.acceptMarketing = false

    await wrapper.vm.handleRegister()

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'maria@email.com',
        acceptTerms: false
      })
    )
  })
})
