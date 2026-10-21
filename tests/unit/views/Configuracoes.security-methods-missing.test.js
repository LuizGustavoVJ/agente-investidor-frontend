import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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

describe('Configuracoes — métodos de segurança ausentes na store auth', () => {
  let wrapper
  let authStore
  let router

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    mockToast.success.mockClear()
    mockToast.error.mockClear()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } },
        { path: '/', name: 'Home', component: { template: '<div />' } }
      ]
    })
    await router.push('/configuracoes')
    await router.isReady()

    wrapper = mount(Configuracoes, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()

    authStore = useAuthStore()
    authStore.user = {
      id: 7,
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@exemplo.com',
      twoFactorEnabled: false
    }
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('auth store não expõe setup2FA, disable2FA, changePassword, deleteAccount nem terminateSession', () => {
    expect(authStore.setup2FA).toBeUndefined()
    expect(authStore.disable2FA).toBeUndefined()
    expect(authStore.changePassword).toBeUndefined()
    expect(authStore.deleteAccount).toBeUndefined()
    expect(authStore.terminateSession).toBeUndefined()
    expect(authStore.exportUserData).toBeUndefined()
    expect(typeof authStore.updateProfile).toBe('function')
  })

  it('setup2FA toasta erro e twoFactorEnabled permanece false', async () => {
    await wrapper.vm.setup2FA()
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Erro ao configurar 2FA')
    expect(mockToast.success).not.toHaveBeenCalled()
    expect(authStore.user.twoFactorEnabled).toBe(false)
  })

  it('disable2FA com confirm: toasta erro e 2FA ativo não muda', async () => {
    authStore.user.twoFactorEnabled = true
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    await wrapper.vm.disable2FA()
    await flushPromises()

    expect(window.confirm).toHaveBeenCalled()
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao desativar 2FA')
    expect(authStore.user.twoFactorEnabled).toBe(true)
    expect(mockToast.success).not.toHaveBeenCalled()
  })

  it('changePassword válido não altera senha: toasta erro e o form permanece', async () => {
    wrapper.vm.passwordForm = {
      currentPassword: 'SenhaAtual1',
      newPassword: 'SenhaNova12',
      confirmPassword: 'SenhaNova12'
    }

    await wrapper.vm.changePassword()
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Erro ao alterar senha')
    expect(mockToast.success).not.toHaveBeenCalled()
    expect(wrapper.vm.passwordForm.currentPassword).toBe('SenhaAtual1')
    expect(wrapper.vm.passwordForm.newPassword).toBe('SenhaNova12')
  })

  it('deleteAccount toasta erro, não navega e o usuário permanece', async () => {
    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.vm.deleteAccount()
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Erro ao excluir conta')
    expect(mockToast.success).not.toHaveBeenCalled()
    expect(pushSpy).not.toHaveBeenCalled()
    expect(authStore.user).toMatchObject({ id: 7, email: 'ana@exemplo.com' })
    expect(authStore.isAuthenticated).toBe(true)
    expect(router.currentRoute.value.path).toBe('/configuracoes')
  })
})
