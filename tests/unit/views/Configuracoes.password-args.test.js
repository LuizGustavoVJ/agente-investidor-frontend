import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
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

describe('Configurações — payload de troca de senha', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    mockToast.success.mockReset()
    mockToast.error.mockReset()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/configuracoes', component: { template: '<div />' } }
      ]
    })

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    authStore = useAuthStore()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('chama changePassword com dois argumentos posicionais e descarta confirmPassword', async () => {
    const changePassword = vi.fn().mockResolvedValue({ success: true })
    authStore.changePassword = changePassword

    wrapper.vm.passwordForm.currentPassword = 'SenhaAtual1'
    wrapper.vm.passwordForm.newPassword = 'SenhaNova12'
    wrapper.vm.passwordForm.confirmPassword = 'SenhaNova12'

    await wrapper.vm.changePassword()

    expect(changePassword).toHaveBeenCalledTimes(1)
    expect(changePassword).toHaveBeenCalledWith('SenhaAtual1', 'SenhaNova12')
    expect(changePassword.mock.calls[0][2]).toBeUndefined()
    expect(changePassword.mock.calls[0][0]).not.toEqual(
      expect.objectContaining({
        confirmPassword: 'SenhaNova12'
      })
    )
  })
})
