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

describe('Cadastro — senha só com espaços passa na validação', () => {
  let wrapper
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/cadastro', name: 'Cadastro', component: { template: '<div />' } },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/login', name: 'Login', component: { template: '<div />' } }
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

  it('isFormValid e validateForm aceitam senha de 8 espaços', () => {
    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.email = 'ana@example.com'
    wrapper.vm.form.password = '        '
    wrapper.vm.form.confirmPassword = '        '
    wrapper.vm.form.acceptTerms = true

    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(true)
    expect(wrapper.vm.errors.password).toBe('')
  })

  it('handleRegister envia a senha em branco para a store', async () => {
    const store = useAuthStore()
    store.register = vi.fn().mockResolvedValue({ success: false, error: 'inválido' })

    wrapper.vm.form.name = 'Ana Silva'
    wrapper.vm.form.email = 'ana@example.com'
    wrapper.vm.form.phone = ''
    wrapper.vm.form.password = '        '
    wrapper.vm.form.confirmPassword = '        '
    wrapper.vm.form.acceptTerms = true

    await wrapper.vm.handleRegister()
    await flushPromises()

    expect(store.register).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Silva',
        email: 'ana@example.com',
        password: '        ',
        confirmPassword: '        ',
        acceptTerms: true
      })
    )
  })
})
