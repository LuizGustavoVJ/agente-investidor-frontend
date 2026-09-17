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

describe('Configurações — senha igual à atual e encerrar sessão', () => {
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

  it('validatePassword aceita nova senha idêntica à senha atual', () => {
    wrapper.vm.passwordForm.currentPassword = 'SenhaAtual1'
    wrapper.vm.passwordForm.newPassword = 'SenhaAtual1'
    wrapper.vm.passwordForm.confirmPassword = 'SenhaAtual1'

    expect(wrapper.vm.validatePassword()).toBe(true)
    expect(wrapper.vm.passwordErrors).toEqual({})
  })

  it('terminateSession não pede confirm e encerra até a sessão marcada como atual', async () => {
    const terminateSession = vi.fn().mockResolvedValue({ success: true })
    authStore.terminateSession = terminateSession
    const confirmSpy = vi.spyOn(window, 'confirm')

    await wrapper.vm.terminateSession({ id: 'sess-atual', isCurrent: true, device: 'Chrome' })

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(terminateSession).toHaveBeenCalledWith('sess-atual')
    expect(mockToast.success).toHaveBeenCalledWith('Sessão encerrada')
  })
})
