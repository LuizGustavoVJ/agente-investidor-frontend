import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Configuracoes — superfície da store e exclusão sem revalidar EXCLUIR', () => {
  let wrapper
  let pinia
  let router
  let authStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    toast.success.mockClear()
    toast.error.mockClear()

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/configuracoes', component: { template: '<div />' } }
      ]
    })
    await router.push('/configuracoes')
    await router.isReady()

    authStore = useAuthStore()
    wrapper = mount(Configuracoes, {
      global: { plugins: [pinia, router] }
    })
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('getDeviceIcon quebra com device undefined', () => {
    expect(() => wrapper.vm.getDeviceIcon(undefined)).toThrow()
    expect(wrapper.vm.getDeviceIcon('iPhone Mobile')).toBe('📱')
    expect(wrapper.vm.getDeviceIcon('Windows Desktop')).toBe('💻')
  })

  it('a store de auth não expõe as actions que a view chama', () => {
    expect(authStore.updateInvestorProfile).toBeUndefined()
    expect(authStore.updateNotificationSettings).toBeUndefined()
    expect(authStore.updatePrivacySettings).toBeUndefined()
    expect(authStore.setup2FA).toBeUndefined()
    expect(authStore.disable2FA).toBeUndefined()
    expect(authStore.terminateSession).toBeUndefined()
    expect(authStore.exportUserData).toBeUndefined()
    expect(authStore.deleteAccount).toBeUndefined()
    expect(authStore.loadUserSettings).toBeUndefined()
    expect(authStore.changePassword).toBeUndefined()
    expect(authStore.activeSessions).toBeUndefined()
  })

  it('saveNotifications captura a action ausente e mostra toast de erro', async () => {
    await wrapper.vm.saveNotifications()
    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar configurações de notificação')
    expect(wrapper.vm.isSavingNotifications).toBe(false)
  })

  it('savePrivacy e saveInvestorProfile também falham na action ausente', async () => {
    await wrapper.vm.savePrivacy()
    await wrapper.vm.saveInvestorProfile()
    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar configurações de privacidade')
    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar perfil de investidor')
  })

  it('deleteAccount não revalida o texto EXCLUIR — só o botão está disabled', async () => {
    wrapper.vm.deleteConfirmation = ''
    const push = vi.spyOn(router, 'push')

    await wrapper.vm.deleteAccount()

    expect(toast.error).toHaveBeenCalledWith('Erro ao excluir conta')
    expect(push).not.toHaveBeenCalled()
  })

  it('saveProfile trata { success: false } da store como sucesso (não lê o retorno)', async () => {
    wrapper.vm.profileForm.firstName = 'Ana'
    wrapper.vm.profileForm.lastName = 'Silva'
    wrapper.vm.profileForm.email = 'ana@ex.com'
    vi.spyOn(authStore, 'updateProfile').mockResolvedValue({ success: false, error: 'email em uso' })

    await wrapper.vm.saveProfile()

    expect(toast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso!')
    expect(toast.error).not.toHaveBeenCalledWith('Erro ao salvar perfil')
  })
})
