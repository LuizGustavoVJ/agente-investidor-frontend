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

describe('Configuracoes — métodos de segurança ignoram { success: false }', () => {
  let wrapper
  let store
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    mockToast.success.mockReset()
    mockToast.error.mockReset()

    store.user = {
      id: 7,
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@exemplo.com',
      twoFactorEnabled: false
    }
    store.loadUserSettings = vi.fn().mockResolvedValue({ success: true })

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
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('changePassword com { success: false } tosta sucesso e limpa o formulário', async () => {
    store.changePassword = vi.fn().mockResolvedValue({
      success: false,
      error: 'Senha atual incorreta'
    })

    wrapper.vm.passwordForm = {
      currentPassword: 'senha-atual-1',
      newPassword: 'senha-nova-12',
      confirmPassword: 'senha-nova-12'
    }

    await wrapper.vm.changePassword()
    await flushPromises()

    expect(store.changePassword).toHaveBeenCalledWith('senha-atual-1', 'senha-nova-12')
    expect(mockToast.success).toHaveBeenCalledWith('Senha alterada com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalledWith('Erro ao alterar senha')
    expect(wrapper.vm.passwordForm).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  })

  it('deleteAccount com { success: false } tosta sucesso e redireciona para /', async () => {
    store.deleteAccount = vi.fn().mockResolvedValue({
      success: false,
      error: 'Confirmação 2FA pendente'
    })

    wrapper.vm.deleteConfirmation = 'EXCLUIR'

    await wrapper.vm.deleteAccount()
    await flushPromises()

    expect(store.deleteAccount).toHaveBeenCalledTimes(1)
    expect(mockToast.success).toHaveBeenCalledWith('Conta excluída com sucesso')
    expect(mockToast.error).not.toHaveBeenCalledWith('Erro ao excluir conta')
    expect(router.currentRoute.value.path).toBe('/')
    expect(store.user).toEqual(
      expect.objectContaining({ email: 'ana@exemplo.com' })
    )
  })

  it('setup2FA com { success: false } tosta sucesso sem ligar twoFactorEnabled', async () => {
    store.setup2FA = vi.fn().mockResolvedValue({
      success: false,
      error: 'QR inválido'
    })

    await wrapper.vm.setup2FA()
    await flushPromises()

    expect(store.setup2FA).toHaveBeenCalledTimes(1)
    expect(mockToast.success).toHaveBeenCalledWith('2FA configurado com sucesso!')
    expect(store.user.twoFactorEnabled).toBe(false)
  })

  it('saveNotifications e savePrivacy com { success: false } tostam sucesso', async () => {
    store.updateNotificationSettings = vi.fn().mockResolvedValue({
      success: false,
      error: 'preferência recusada'
    })
    store.updatePrivacySettings = vi.fn().mockResolvedValue({
      success: false,
      error: 'consentimento recusado'
    })

    await wrapper.vm.saveNotifications()
    await wrapper.vm.savePrivacy()
    await flushPromises()

    expect(mockToast.success).toHaveBeenCalledWith('Configurações de notificação salvas!')
    expect(mockToast.success).toHaveBeenCalledWith('Configurações de privacidade salvas!')
    expect(mockToast.error).not.toHaveBeenCalled()
  })
})
