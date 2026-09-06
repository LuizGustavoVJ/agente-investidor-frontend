import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    toggle2FA: vi.fn(),
    get2FAQRCode: vi.fn(),
    getSecuritySettings: vi.fn(),
    terminateSession: vi.fn(),
    exportUserData: vi.fn(),
    deleteAccount: vi.fn()
  }
}))

import { authAPI } from '@/api/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div />' } },
    { path: '/configuracoes', name: 'Configuracoes', component: Configuracoes }
  ]
})

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Configuracoes — store real de senha, 2FA e exclusão', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()

    authAPI.checkAuth.mockResolvedValue({
      data: {
        success: true,
        user: {
          id: 1,
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@email.com',
          twoFactorEnabled: false
        }
      }
    })
    authAPI.getSecuritySettings.mockResolvedValue({
      data: {
        success: true,
        data: {
          twoFactorEnabled: false,
          sessions: [{ id: 's1', device: 'Desktop' }]
        }
      }
    })

    wrapper = mount(Configuracoes, {
      global: {
        plugins: [router]
      }
    })

    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  const openSection = async (label) => {
    const button = wrapper.findAll('.nav-btn').find((btn) => btn.text().includes(label))
    await button.trigger('click')
    await wrapper.vm.$nextTick()
  }

  it('recusa senha atual incorreta sem toast de sucesso', async () => {
    authAPI.changePassword.mockResolvedValue({
      data: { success: false, message: 'Senha atual incorreta' }
    })

    await openSection('Segurança')
    await wrapper.find('#currentPassword').setValue('errada')
    await wrapper.find('#newPassword').setValue('NovaSenha1')
    await wrapper.find('#confirmPassword').setValue('NovaSenha1')
    await wrapper.find('.security-form').trigger('submit')
    await flushPromises()

    expect(authAPI.changePassword).toHaveBeenCalledWith({
      currentPassword: 'errada',
      newPassword: 'NovaSenha1',
      confirmPassword: 'NovaSenha1'
    })
    expect(mockToast.success).not.toHaveBeenCalled()
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao alterar senha')
  })

  it('ativa 2FA pela store e atualiza o estado do usuário', async () => {
    authAPI.get2FAQRCode.mockResolvedValue({ data: { data: { qr: 'otpauth://' } } })
    authAPI.toggle2FA.mockResolvedValue({ data: { success: true } })

    await openSection('Segurança')
    await wrapper.find('.twofa-setup .security-btn').trigger('click')
    await flushPromises()

    expect(authAPI.toggle2FA).toHaveBeenCalledWith(true)
    expect(authStore.user.twoFactorEnabled).toBe(true)
    expect(mockToast.success).toHaveBeenCalledWith('2FA configurado com sucesso!')
  })

  it('não navega para home se a exclusão da conta falhar', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    authAPI.deleteAccount.mockResolvedValue({
      data: { success: false, message: 'Há corretoras conectadas' }
    })

    wrapper.vm.showDeleteModal = true
    wrapper.vm.deleteConfirmation = 'EXCLUIR'
    await wrapper.vm.$nextTick()
    await wrapper.vm.deleteAccount()
    await flushPromises()

    expect(authAPI.deleteAccount).toHaveBeenCalled()
    expect(authStore.user).not.toBeNull()
    expect(pushSpy).not.toHaveBeenCalledWith('/')
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao excluir conta')
  })
})
