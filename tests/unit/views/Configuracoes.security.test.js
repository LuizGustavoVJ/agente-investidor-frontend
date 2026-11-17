import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}
const mockPush = vi.fn()

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import Configuracoes from '@/views/Configuracoes.vue'

describe('Configurações — senha, perfil, 2FA e exclusão', () => {
  let wrapper
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    store.loadUserSettings = vi.fn().mockResolvedValue(undefined)
    store.changePassword = vi.fn().mockResolvedValue({ success: true })
    store.setup2FA = vi.fn().mockResolvedValue({ success: true })
    store.disable2FA = vi.fn().mockResolvedValue({ success: true })
    store.deleteAccount = vi.fn().mockResolvedValue({ success: true })
    store.terminateSession = vi.fn().mockResolvedValue({ success: true })
    store.updateProfile = vi.fn().mockResolvedValue({ success: true })
    vi.clearAllMocks()

    wrapper = mount(Configuracoes, {
      global: {
        stubs: { 'router-link': true }
      }
    })
    wrapper.vm.isInitialLoading = false
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('validatePassword', () => {
    it('exige senha atual, mínimo de 8 caracteres e confirmação igual', () => {
      wrapper.vm.passwordForm.currentPassword = ''
      wrapper.vm.passwordForm.newPassword = '1234567'
      wrapper.vm.passwordForm.confirmPassword = 'outra'

      expect(wrapper.vm.validatePassword()).toBe(false)
      expect(wrapper.vm.passwordErrors.currentPassword).toBe('Senha atual é obrigatória')
      expect(wrapper.vm.passwordErrors.newPassword).toBe('Nova senha deve ter pelo menos 8 caracteres')
      expect(wrapper.vm.passwordErrors.confirmPassword).toBe('Senhas não coincidem')
    })

    it('aceita senha de 8 caracteres sem símbolo nem maiúscula', () => {
      wrapper.vm.passwordForm.currentPassword = 'antiga12'
      wrapper.vm.passwordForm.newPassword = 'abcdefgh'
      wrapper.vm.passwordForm.confirmPassword = 'abcdefgh'

      expect(wrapper.vm.validatePassword()).toBe(true)
      expect(wrapper.vm.passwordErrors).toEqual({})
    })
  })

  describe('força da senha', () => {
    it('não pontua símbolo; 8 letras minúsculas ficam em Regular', () => {
      wrapper.vm.passwordForm.newPassword = 'abcdefgh'

      expect(wrapper.vm.getPasswordStrengthPercent()).toBe(50)
      expect(wrapper.vm.getPasswordStrengthClass()).toBe('fair')
      expect(wrapper.vm.getPasswordStrengthText()).toBe('Regular')
    })

    it('atinge Forte só com minúscula, maiúscula e número', () => {
      wrapper.vm.passwordForm.newPassword = 'Abcdefg1'

      expect(wrapper.vm.getPasswordStrengthPercent()).toBe(100)
      expect(wrapper.vm.getPasswordStrengthClass()).toBe('strong')
      expect(wrapper.vm.getPasswordStrengthText()).toBe('Forte')
    })
  })

  describe('validateProfile', () => {
    it('rejeita e-mail sem ponto no domínio e campos em branco', () => {
      wrapper.vm.profileForm.firstName = '  '
      wrapper.vm.profileForm.lastName = ''
      wrapper.vm.profileForm.email = 'ana@ex'

      expect(wrapper.vm.validateProfile()).toBe(false)
      expect(wrapper.vm.profileErrors.firstName).toBe('Nome é obrigatório')
      expect(wrapper.vm.profileErrors.lastName).toBe('Sobrenome é obrigatório')
      expect(wrapper.vm.profileErrors.email).toBe('Email inválido')
    })

    it('quebra se firstName vier nulo em vez de string vazia', () => {
      wrapper.vm.profileForm.firstName = null
      wrapper.vm.profileForm.lastName = 'Silva'
      wrapper.vm.profileForm.email = 'ana@ex.com'

      expect(() => wrapper.vm.validateProfile()).toThrow()
    })
  })

  describe('changePassword', () => {
    it('não chama a store quando a validação falha', async () => {
      wrapper.vm.passwordForm.currentPassword = 'antiga'
      wrapper.vm.passwordForm.newPassword = 'nova'
      wrapper.vm.passwordForm.confirmPassword = 'nova'

      await wrapper.vm.changePassword()

      expect(store.changePassword).not.toHaveBeenCalled()
      expect(mockToast.success).not.toHaveBeenCalled()
    })

    it('envia dois argumentos soltos, sem confirmPassword', async () => {
      wrapper.vm.passwordForm.currentPassword = 'antiga12'
      wrapper.vm.passwordForm.newPassword = 'novaSenha'
      wrapper.vm.passwordForm.confirmPassword = 'novaSenha'

      await wrapper.vm.changePassword()

      expect(store.changePassword).toHaveBeenCalledTimes(1)
      expect(store.changePassword).toHaveBeenCalledWith('antiga12', 'novaSenha')
      expect(store.changePassword.mock.calls[0]).toHaveLength(2)
      expect(wrapper.vm.passwordForm).toEqual({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    })
  })

  describe('2FA e exclusão de conta', () => {
    it('setup2FA não pede código de verificação', async () => {
      await wrapper.vm.setup2FA()

      expect(store.setup2FA).toHaveBeenCalledTimes(1)
      expect(store.setup2FA).toHaveBeenCalledWith()
    })

    it('disable2FA respeita o cancelamento do confirm', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      await wrapper.vm.disable2FA()

      expect(confirmSpy).toHaveBeenCalled()
      expect(store.disable2FA).not.toHaveBeenCalled()
      confirmSpy.mockRestore()
    })

    it('deleteAccount não revalida o texto EXCLUIR e redireciona para /', async () => {
      wrapper.vm.deleteConfirmation = ''

      await wrapper.vm.deleteAccount()

      expect(store.deleteAccount).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('botão de excluir fica desabilitado sem a confirmação EXCLUIR', async () => {
      wrapper.vm.showDeleteModal = true
      wrapper.vm.deleteConfirmation = 'excluir'
      await wrapper.vm.$nextTick()

      const deleteBtn = wrapper.find('.delete-btn')
      expect(deleteBtn.attributes('disabled')).toBeDefined()
    })
  })
})
