import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Cadastro: senha fraca ainda é submetível', () => {
  let wrapper

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } }
      ]
    })
    wrapper = mount(Cadastro, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('isFormValid e validateForm aceitam senha só com 8 letras minúsculas', async () => {
    await wrapper.find('#name').setValue('Ana Silva')
    await wrapper.find('#email').setValue('ana@ex.com')
    await wrapper.find('#password').setValue('password')
    await wrapper.find('#confirmPassword').setValue('password')
    const terms = wrapper.findAll('input[type="checkbox"]')[0]
    await terms.setValue(true)

    expect(wrapper.vm.passwordStrength.text).toMatch(/fraca/i)
    expect(wrapper.vm.passwordStrength.text).toMatch(/maiúsculas|números|símbolos/i)
    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(true)
  })

  it('email só exige @, então a@b passa', async () => {
    wrapper.vm.form.email = 'a@b'
    wrapper.vm.form.name = 'Ana'
    wrapper.vm.form.password = 'password'
    wrapper.vm.form.confirmPassword = 'password'
    wrapper.vm.form.acceptTerms = true

    expect(wrapper.vm.validateForm()).toBe(true)
    expect(wrapper.vm.errors.email).toBe('')
  })

  it('OAuth de cadastro só mostra toast, sem redirecionar', async () => {
    const hrefBefore = window.location.href
    await wrapper.vm.registerWithGoogle()
    await wrapper.vm.registerWithGitHub()

    expect(toast.info).toHaveBeenCalledWith('Cadastro com Google em desenvolvimento')
    expect(toast.info).toHaveBeenCalledWith('Cadastro com GitHub em desenvolvimento')
    expect(window.location.href).toBe(hrefBefore)
  })
})
