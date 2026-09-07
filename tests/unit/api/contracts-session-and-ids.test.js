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

describe('Contratos restantes de sessão e IDs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
    client.put.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
  })

  describe('authAPI — ciclo de sessão', () => {
    it('logout, checkAuth e refresh usam os endpoints de cookie', async () => {
      await authAPI.logout()
      await authAPI.checkAuth()
      await authAPI.refreshToken()

      expect(client.post).toHaveBeenCalledWith('/auth/logout')
      expect(client.get).toHaveBeenCalledWith('/auth/me')
      expect(client.post).toHaveBeenCalledWith('/auth/refresh')
    })

    it('updateProfile envia o payload em PUT /auth/profile', async () => {
      const profile = { firstName: 'Ana', email: 'ana@email.com' }
      await authAPI.updateProfile(profile)

      expect(client.put).toHaveBeenCalledWith('/auth/profile', profile)
    })
  })

  describe('analysisAPI — paths com id/símbolo', () => {
    it('getAnalysisResults usa o id da análise no path', async () => {
      await analysisAPI.getAnalysisResults('anl-9')
      expect(client.get).toHaveBeenCalledWith('/methodology/results/anl-9')
    })

    it('getPortfolioAnalysis e runCustomAnalysis postam o payload bruto', async () => {
      await analysisAPI.getPortfolioAnalysis({ holdings: ['PETR4'] })
      await analysisAPI.runCustomAnalysis({ name: 'custom' })

      expect(client.post).toHaveBeenCalledWith('/analysis/portfolio', { holdings: ['PETR4'] })
      expect(client.post).toHaveBeenCalledWith('/analysis/custom', { name: 'custom' })
    })

    it('getSectorAnalysis e getRiskReturnAnalysis usam setor e payload', async () => {
      await analysisAPI.getSectorAnalysis('energia')
      await analysisAPI.getRiskReturnAnalysis({ weights: [0.5, 0.5] })

      expect(client.get).toHaveBeenCalledWith('/analysis/sector/energia')
      expect(client.post).toHaveBeenCalledWith('/analysis/risk-return', { weights: [0.5, 0.5] })
    })
  })

  describe('brokersAPI — extrato, conta e configuração', () => {
    it('consulta transações, taxas, conta e logs com connectionId', async () => {
      await brokersAPI.getBrokerTransactions('xp-1', { from: '2026-01-01' })
      await brokersAPI.getBrokerFees('xp-1')
      await brokersAPI.getAccountInfo('xp-1')
      await brokersAPI.getConnectionLogs('xp-1', { level: 'error' })

      expect(client.get).toHaveBeenCalledWith('/brokers/transactions/xp-1', {
        params: { from: '2026-01-01' }
      })
      expect(client.get).toHaveBeenCalledWith('/brokers/fees/xp-1')
      expect(client.get).toHaveBeenCalledWith('/brokers/account/xp-1')
      expect(client.get).toHaveBeenCalledWith('/brokers/logs/xp-1', {
        params: { level: 'error' }
      })
    })

    it('lê capacidades, auto-sync e notificações pelo id correto', async () => {
      await brokersAPI.getBrokerCapabilities('xp')
      await brokersAPI.getSyncConfiguration('xp-1')
      await brokersAPI.getNotificationConfiguration('xp-1')

      expect(client.get).toHaveBeenCalledWith('/brokers/capabilities/xp')
      expect(client.get).toHaveBeenCalledWith('/brokers/auto-sync/xp-1')
      expect(client.get).toHaveBeenCalledWith('/brokers/notifications/xp-1')
    })
  })
})
