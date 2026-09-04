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
import { brokersAPI } from '@/api/brokers'
import { analysisAPI } from '@/api/analysis'
import { portfolioAPI } from '@/api/portfolio'

describe('Contratos de API restantes — segurança, transações e compartilhamento', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
    client.put.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
  })

  describe('authAPI — 2FA, reset e verificação', () => {
    it('requestPasswordReset envia só o email', async () => {
      await authAPI.requestPasswordReset('joao@email.com')

      expect(client.post).toHaveBeenCalledWith('/auth/password/reset-request', {
        email: 'joao@email.com'
      })
    })

    it('toggle2FA envia enabled no corpo', async () => {
      await authAPI.toggle2FA(true)

      expect(client.put).toHaveBeenCalledWith('/auth/security/2fa', { enabled: true })
    })

    it('verifyEmail e resend usam os endpoints corretos', async () => {
      await authAPI.verifyEmail('tok-email')
      await authAPI.resendVerificationEmail()

      expect(client.post).toHaveBeenCalledWith('/auth/email/verify', { token: 'tok-email' })
      expect(client.post).toHaveBeenCalledWith('/auth/email/resend-verification')
    })
  })

  describe('portfolioAPI — transações, rebalance e export', () => {
    it('CRUD de transação usa o id no path', async () => {
      await portfolioAPI.addTransaction({ symbol: 'PETR4', quantity: 10 })
      await portfolioAPI.updateTransaction('tx-1', { quantity: 20 })
      await portfolioAPI.deleteTransaction('tx-1')

      expect(client.post).toHaveBeenCalledWith('/portfolio/transactions', {
        symbol: 'PETR4',
        quantity: 10
      })
      expect(client.put).toHaveBeenCalledWith('/portfolio/transactions/tx-1', { quantity: 20 })
      expect(client.delete).toHaveBeenCalledWith('/portfolio/transactions/tx-1')
    })

    it('applyRebalance posta o payload e exportData usa blob', async () => {
      await portfolioAPI.applyRebalance({ target: { acoes: 80 } })
      await portfolioAPI.exportData('excel')

      expect(client.post).toHaveBeenCalledWith('/portfolio/rebalance', { target: { acoes: 80 } })
      expect(client.get).toHaveBeenCalledWith('/portfolio/export', {
        params: { format: 'excel' },
        responseType: 'blob'
      })
    })

    it('getBenchmarkComparison usa IBOV e CDI por padrão', async () => {
      await portfolioAPI.getBenchmarkComparison()

      expect(client.get).toHaveBeenCalledWith('/portfolio/benchmark', {
        params: { benchmarks: 'IBOV,CDI' }
      })
    })
  })

  describe('analysisAPI — compartilhamento e alertas', () => {
    it('shareAnalysis e getSharedAnalysis usam id/token no path', async () => {
      await analysisAPI.shareAnalysis('an-1', { email: 'amigo@email.com' })
      await analysisAPI.getSharedAnalysis('share-tok')

      expect(client.post).toHaveBeenCalledWith('/analysis/share/an-1', {
        email: 'amigo@email.com'
      })
      expect(client.get).toHaveBeenCalledWith('/analysis/shared/share-tok')
    })

    it('configureAlerts posta a configuração', async () => {
      await analysisAPI.configureAlerts({ type: 'price', symbol: 'PETR4' })

      expect(client.post).toHaveBeenCalledWith('/analysis/alerts/configure', {
        type: 'price',
        symbol: 'PETR4'
      })
    })

    it('compareAssets envia a lista no corpo', async () => {
      await analysisAPI.compareAssets(['PETR4', 'VALE3'])

      expect(client.post).toHaveBeenCalledWith('/analysis/compare', {
        symbols: ['PETR4', 'VALE3']
      })
    })
  })

  describe('brokersAPI — credenciais, mapeamento e validação', () => {
    it('updateCredentials usa connectionId no path', async () => {
      await brokersAPI.updateCredentials('xp-1', { token: 'novo' })

      expect(client.put).toHaveBeenCalledWith('/brokers/credentials/xp-1', { token: 'novo' })
    })

    it('mapAssets e validateImportedData postam o payload no endpoint certo', async () => {
      await brokersAPI.mapAssets({ PETR4: 'PETR4.SA' })
      await brokersAPI.validateImportedData('xp-1', { requireSymbol: true })

      expect(client.post).toHaveBeenCalledWith('/brokers/assets/map', { PETR4: 'PETR4.SA' })
      expect(client.post).toHaveBeenCalledWith('/brokers/validate/xp-1', { requireSymbol: true })
    })
  })
})
