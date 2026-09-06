import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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
import { useAuthStore } from '@/stores/auth'

describe('Auth Store — segurança, sessões e exclusão de conta', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
    window.location.pathname = '/'
    window.location.href = 'http://localhost:3000/'
  })

  describe('checkAuthStatus — sessionStorage inválido', () => {
    it('trata JSON corrompido como não autenticado e marca a store inicializada', async () => {
      sessionStorage.getItem.mockReturnValue('{user:broken')
      authAPI.checkAuth.mockRejectedValue(new Error('ignored'))

      const result = await store.checkAuthStatus()

      expect(result).toBe(false)
      expect(store.user).toBeNull()
      expect(store.isInitialized).toBe(true)
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('register — auto-login falha', () => {
    it('propaga falha do login sem persistir usuário', async () => {
      authAPI.register.mockResolvedValue({ data: { success: true } })
      authAPI.login.mockResolvedValue({ data: { success: false, message: 'Conta pendente de verificação' } })

      const result = await store.register({
        email: 'joao@email.com',
        password: 'SenhaForte1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Conta pendente de verificação')
      expect(store.user).toBeNull()
      expect(sessionStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('changePassword', () => {
    it('envia senha atual, nova e confirmação no contrato da API', async () => {
      authAPI.changePassword.mockResolvedValue({ data: { success: true } })

      const result = await store.changePassword('antiga', 'NovaSenha1')

      expect(result).toEqual({ success: true })
      expect(authAPI.changePassword).toHaveBeenCalledWith({
        currentPassword: 'antiga',
        newPassword: 'NovaSenha1',
        confirmPassword: 'NovaSenha1'
      })
      expect(store.isLoading).toBe(false)
    })

    it('lança erro e não mascara a mensagem da API quando a troca é recusada', async () => {
      authAPI.changePassword.mockResolvedValue({
        data: { success: false, message: 'Senha atual incorreta' }
      })

      await expect(store.changePassword('errada', 'NovaSenha1')).rejects.toThrow(
        'Senha atual incorreta'
      )
      expect(store.error).toBe('Senha atual incorreta')
    })
  })

  describe('2FA', () => {
    it('obtém QR, ativa 2FA e persiste twoFactorEnabled no usuário', async () => {
      store.user = { id: 1, email: 'joao@email.com', twoFactorEnabled: false }
      authAPI.get2FAQRCode.mockResolvedValue({ data: { data: { qr: 'otpauth://' } } })
      authAPI.toggle2FA.mockResolvedValue({ data: { success: true } })

      const result = await store.setup2FA()

      expect(authAPI.get2FAQRCode).toHaveBeenCalled()
      expect(authAPI.toggle2FA).toHaveBeenCalledWith(true)
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ qr: 'otpauth://' })
      expect(store.user.twoFactorEnabled).toBe(true)
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify({ id: 1, email: 'joao@email.com', twoFactorEnabled: true })
      )
    })

    it('não chama toggle2FA se o QR falhar', async () => {
      authAPI.get2FAQRCode.mockRejectedValue(new Error('QR indisponível'))

      await expect(store.setup2FA()).rejects.toThrow('QR indisponível')
      expect(authAPI.toggle2FA).not.toHaveBeenCalled()
    })

    it('desativa 2FA e atualiza o usuário persistido', async () => {
      store.user = { id: 1, twoFactorEnabled: true }
      authAPI.toggle2FA.mockResolvedValue({ data: { success: true } })

      await store.disable2FA()

      expect(authAPI.toggle2FA).toHaveBeenCalledWith(false)
      expect(store.user.twoFactorEnabled).toBe(false)
    })
  })

  describe('sessões e exportação', () => {
    it('remove só a sessão encerrada', async () => {
      store.activeSessions = [
        { id: 's1', device: 'Desktop' },
        { id: 's2', device: 'Mobile' }
      ]
      authAPI.terminateSession.mockResolvedValue({ data: { success: true } })

      await store.terminateSession('s2')

      expect(authAPI.terminateSession).toHaveBeenCalledWith('s2')
      expect(store.activeSessions).toEqual([{ id: 's1', device: 'Desktop' }])
    })

    it('não remove sessão se a API recusar', async () => {
      store.activeSessions = [{ id: 's1' }]
      authAPI.terminateSession.mockResolvedValue({
        data: { success: false, message: 'Sessão atual não pode ser encerrada' }
      })

      await expect(store.terminateSession('s1')).rejects.toThrow(
        'Sessão atual não pode ser encerrada'
      )
      expect(store.activeSessions).toEqual([{ id: 's1' }])
    })

    it('dispara download do blob exportado', async () => {
      const blob = new Blob(['{"email":"joao@email.com"}'], { type: 'application/json' })
      authAPI.exportUserData.mockResolvedValue({ data: blob })

      const createObjectURL = vi.fn(() => 'blob:export')
      const revokeObjectURL = vi.fn()
      vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

      const click = vi.fn()
      const originalCreate = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = originalCreate(tag)
        if (tag === 'a') {
          el.click = click
        }
        return el
      })

      const result = await store.exportUserData()

      expect(result.success).toBe(true)
      expect(createObjectURL).toHaveBeenCalledWith(blob)
      expect(click).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:export')

      document.createElement.mockRestore()
      vi.unstubAllGlobals()
    })
  })

  describe('deleteAccount e loadUserSettings', () => {
    it('limpa usuário e sessões só após exclusão confirmada pela API', async () => {
      store.user = { id: 1, email: 'joao@email.com' }
      store.activeSessions = [{ id: 's1' }]
      authAPI.deleteAccount.mockResolvedValue({ data: { success: true } })

      const result = await store.deleteAccount()

      expect(result.success).toBe(true)
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.activeSessions).toEqual([])
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('mantém a conta local se a exclusão falhar', async () => {
      store.user = { id: 1 }
      const error = new Error('Request failed')
      error.response = { data: { message: 'Há corretoras conectadas' } }
      authAPI.deleteAccount.mockRejectedValue(error)

      await expect(store.deleteAccount()).rejects.toThrow('Há corretoras conectadas')
      expect(store.user).toEqual({ id: 1 })
    })

    it('hidrata perfil, 2FA e sessões a partir de /me e security', async () => {
      authAPI.checkAuth.mockResolvedValue({
        data: {
          success: true,
          user: { id: 1, firstName: 'João', email: 'joao@email.com' }
        }
      })
      authAPI.getSecuritySettings.mockResolvedValue({
        data: {
          success: true,
          data: {
            twoFactorEnabled: true,
            sessions: [{ id: 's1', device: 'Desktop' }]
          }
        }
      })

      const result = await store.loadUserSettings()

      expect(result.success).toBe(true)
      expect(store.user).toEqual({
        id: 1,
        firstName: 'João',
        email: 'joao@email.com',
        twoFactorEnabled: true
      })
      expect(store.activeSessions).toEqual([{ id: 's1', device: 'Desktop' }])
    })

    it('falha o carregamento se /me recusar sem aplicar sessões parciais', async () => {
      authAPI.checkAuth.mockResolvedValue({ data: { success: false, message: 'Token expirado' } })
      authAPI.getSecuritySettings.mockResolvedValue({
        data: { success: true, data: { sessions: [{ id: 's1' }] } }
      })

      await expect(store.loadUserSettings()).rejects.toThrow('Token expirado')
      expect(store.activeSessions).toEqual([])
      expect(store.user).toBeNull()
    })
  })

  describe('preferências persistidas via updateProfile', () => {
    it('grava perfil de investidor e lança se a API recusar', async () => {
      store.user = { id: 1, name: 'João' }
      authAPI.updateProfile.mockResolvedValue({
        data: { success: true, user: { investorProfile: { riskProfile: 'moderate' } } }
      })

      const result = await store.updateInvestorProfile({ riskProfile: 'moderate' })

      expect(result.success).toBe(true)
      expect(store.user.investorProfile).toEqual({ riskProfile: 'moderate' })
      expect(authAPI.updateProfile).toHaveBeenCalledWith({
        investorProfile: { riskProfile: 'moderate' }
      })

      authAPI.updateProfile.mockResolvedValue({
        data: { success: false, message: 'Perfil inválido' }
      })

      await expect(store.updateNotificationSettings({ email: true })).rejects.toThrow(
        'Perfil inválido'
      )
    })
  })
})
