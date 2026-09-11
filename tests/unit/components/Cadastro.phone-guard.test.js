import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'
import { useAuthStore } from '@/stores/auth'
import { requireCompleteProfile } from '@/middleware/auth'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

describe('Cadastro — telefone opcional vs requireCompleteProfile', () => {
  let wrapper
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/cadastro', name: 'Cadastro', component: Cadastro },
        { path: '/login', name: 'Login', component: { template: '<div />' } },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/termos', name: 'Termos', component: { template: '<div />' } },
        { path: '/privacidade', name: 'Privacidade', component: { template: '<div />' } }
      ]
    })
    await router.push('/cadastro')
    await router.isReady()

    wrapper = mount(Cadastro, {
      global: {
        plugins: [router]
      }
    })
  })

  it('isFormValid e validateForm aceitam cadastro sem telefone', async () => {
    await wrapper.get('#name').setValue('Maria Silva')
    await wrapper.get('#email').setValue('maria@email.com')
    await wrapper.get('#password').setValue('SenhaForte1')
    await wrapper.get('#confirmPassword').setValue('SenhaForte1')
    await wrapper.find('#phone').setValue('')

    const termsCheckbox = wrapper.findAll('input[type="checkbox"]')[0]
    await termsCheckbox.setValue(true)

    expect(wrapper.vm.form.phone).toBe('')
    expect(wrapper.vm.isFormValid).toBe(true)
    expect(wrapper.vm.validateForm()).toBe(true)
    expect(wrapper.vm.errors.phone).toBe('')
  })

  it('usuário recém-cadastrado sem telefone é bloqueado por requireCompleteProfile', async () => {
    const next = vi.fn()
    const store = useAuthStore()
    store.user = {
      name: 'Maria Silva',
      email: 'maria@email.com'
    }

    await requireCompleteProfile(
      { name: 'Dashboard', fullPath: '/dashboard', path: '/dashboard' },
      { name: 'Cadastro', fullPath: '/cadastro', path: '/cadastro' },
      next
    )

    expect(next).toHaveBeenCalledWith({
      name: 'ProfileSetup',
      query: { redirect: '/dashboard' }
    })
  })
})
