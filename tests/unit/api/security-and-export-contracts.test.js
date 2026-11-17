import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import client from '@/api/client'
import { authAPI } from '@/api/auth'
import { analysisAPI } from '@/api/analysis'
import { portfolioAPI } from '@/api/portfolio'
import { brokersAPI } from '@/api/brokers'

describe('Contratos restantes de segurança, share e export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
    client.put.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
  })

  describe('authAPI — 2FA e reset', () => {
    it('toggle2FA envia só enabled, sem código', async () => {
      await authAPI.toggle2FA(true)

      expect(client.put).toHaveBeenCalledWith('/auth/security/2fa', { enabled: true })
    })

    it('verify2FA envia o código cru', async () => {
      await authAPI.verify2FA('000000')

      expect(client.post).toHaveBeenCalledWith('/auth/security/2fa/verify', { code: '000000' })
    })

    it('requestPasswordReset envia só o e-mail', async () => {
      await authAPI.requestPasswordReset('ana@ex.com')

      expect(client.post).toHaveBeenCalledWith('/auth/password/reset-request', {
        email: 'ana@ex.com'
      })
    })

    it('confirmPasswordReset descarta campos extras e exige token', async () => {
      await authAPI.confirmPasswordReset({
        token: 'tok',
        newPassword: 'Nova123!',
        confirmPassword: 'Nova123!',
        email: 'ana@ex.com'
      })

      expect(client.post).toHaveBeenCalledWith('/auth/password/reset-confirm', {
        token: 'tok',
        newPassword: 'Nova123!',
        confirmPassword: 'Nova123!'
      })
      expect(client.post.mock.calls[0][1]).not.toHaveProperty('email')
    })

    it('verifyEmail interpola o token no body, não na URL', async () => {
      await authAPI.verifyEmail('abc/../../../x')

      expect(client.post).toHaveBeenCalledWith('/auth/email/verify', {
        token: 'abc/../../../x'
      })
    })
  })

  describe('analysisAPI — share e joins', () => {
    it('shareAnalysis interpola analysisId cru na URL', async () => {
      await analysisAPI.shareAnalysis('id/1', { public: true, email: 'a@b.com' })

      expect(client.post).toHaveBeenCalledWith('/analysis/share/id/1', {
        public: true,
        email: 'a@b.com'
      })
    })

    it('getSharedAnalysis interpola o token cru', async () => {
      await analysisAPI.getSharedAnalysis('../secret')

      expect(client.get).toHaveBeenCalledWith('/analysis/shared/../secret')
    })

    it('getTechnicalIndicators junta a lista; vazio vira string vazia', async () => {
      await analysisAPI.getTechnicalIndicators('PETR4', ['rsi', 'macd'])
      await analysisAPI.getTechnicalIndicators('PETR4')

      expect(client.get).toHaveBeenNthCalledWith(1, '/analysis/technical/PETR4', {
        params: { indicators: 'rsi,macd' }
      })
      expect(client.get).toHaveBeenNthCalledWith(2, '/analysis/technical/PETR4', {
        params: { indicators: '' }
      })
    })

    it('compareAssets envia o array sem copiar', async () => {
      const symbols = ['PETR4', 'VALE3']
      await analysisAPI.compareAssets(symbols)

      expect(client.post).toHaveBeenCalledWith('/analysis/compare', { symbols })
    })
  })

  describe('portfolioAPI — blob e transações', () => {
    it('exportData sempre pede blob, inclusive para json', async () => {
      await portfolioAPI.exportData('json')
      await portfolioAPI.exportData()

      expect(client.get).toHaveBeenNthCalledWith(1, '/portfolio/export', {
        params: { format: 'json' },
        responseType: 'blob'
      })
      expect(client.get).toHaveBeenNthCalledWith(2, '/portfolio/export', {
        params: { format: 'excel' },
        responseType: 'blob'
      })
    })

    it('CRUD de transação interpola o id cru', async () => {
      await portfolioAPI.updateTransaction('tx/1', { quantity: 2 })
      await portfolioAPI.deleteTransaction('tx/1')

      expect(client.put).toHaveBeenCalledWith('/portfolio/transactions/tx/1', { quantity: 2 })
      expect(client.delete).toHaveBeenCalledWith('/portfolio/transactions/tx/1')
    })
  })

  describe('brokersAPI — statement e notificações', () => {
    it('getBrokerStatement manda period como query', async () => {
      await brokersAPI.getBrokerStatement('xp 1', '2026-01')

      expect(client.get).toHaveBeenCalledWith('/brokers/statement/xp 1', {
        params: { period: '2026-01' }
      })
    })

    it('configureBrokerNotifications interpola connectionId cru', async () => {
      await brokersAPI.configureBrokerNotifications('xp/1', { email: true })

      expect(client.put).toHaveBeenCalledWith('/brokers/notifications/xp/1', { email: true })
    })
  })
})
