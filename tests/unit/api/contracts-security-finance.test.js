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

describe('Contratos de API — segurança, extratos e alertas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
    client.put.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
  })

  describe('authAPI — sessão, exportação e exclusão', () => {
    it('terminateSession usa o id no path', async () => {
      await authAPI.terminateSession('sess-9')

      expect(client.delete).toHaveBeenCalledWith('/auth/sessions/sess-9')
    })

    it('exportUserData pede blob e deleteAccount aponta para /auth/account', async () => {
      await authAPI.exportUserData()
      await authAPI.deleteAccount()

      expect(client.get).toHaveBeenCalledWith('/auth/export', { responseType: 'blob' })
      expect(client.delete).toHaveBeenCalledWith('/auth/account')
    })

    it('getSecuritySettings e get2FAQRCode usam os endpoints de segurança', async () => {
      await authAPI.getSecuritySettings()
      await authAPI.get2FAQRCode()

      expect(client.get).toHaveBeenCalledWith('/auth/security')
      expect(client.get).toHaveBeenCalledWith('/auth/security/2fa/qr')
    })
  })

  describe('brokersAPI — posições, saldo e extrato', () => {
    it('consulta posições, saldo e extrato com period na query', async () => {
      await brokersAPI.getBrokerPositions('xp-1')
      await brokersAPI.getBrokerBalance('xp-1')
      await brokersAPI.getBrokerStatement('xp-1', '30d')

      expect(client.get).toHaveBeenCalledWith('/brokers/positions/xp-1')
      expect(client.get).toHaveBeenCalledWith('/brokers/balance/xp-1')
      expect(client.get).toHaveBeenCalledWith('/brokers/statement/xp-1', {
        params: { period: '30d' }
      })
    })

    it('configura auto-sync e notificações no connectionId correto', async () => {
      await brokersAPI.configureAutoSync('xp-1', { enabled: true, interval: '1h' })
      await brokersAPI.configureBrokerNotifications('xp-1', { email: true })

      expect(client.put).toHaveBeenCalledWith('/brokers/auto-sync/xp-1', {
        enabled: true,
        interval: '1h'
      })
      expect(client.put).toHaveBeenCalledWith('/brokers/notifications/xp-1', { email: true })
    })

    it('exportToBroker e getImportReport usam ids no path', async () => {
      await brokersAPI.exportToBroker('xp-1', { format: 'csv' })
      await brokersAPI.getImportReport('imp-22')

      expect(client.post).toHaveBeenCalledWith('/brokers/export/xp-1', { format: 'csv' })
      expect(client.get).toHaveBeenCalledWith('/brokers/import/report/imp-22')
    })
  })

  describe('portfolioAPI — dividendos, detalhe e rebalance', () => {
    it('getDividends e getAssetDetails encaminham filtros e símbolo', async () => {
      await portfolioAPI.getDividends({ year: 2026 })
      await portfolioAPI.getAssetDetails('PETR4')

      expect(client.get).toHaveBeenCalledWith('/portfolio/dividends', {
        params: { year: 2026 }
      })
      expect(client.get).toHaveBeenCalledWith('/portfolio/assets/PETR4')
    })

    it('getRebalanceSuggestions e getSyncStatus usam paths estáveis', async () => {
      await portfolioAPI.getRebalanceSuggestions()
      await portfolioAPI.getSyncStatus()

      expect(client.get).toHaveBeenCalledWith('/portfolio/rebalance')
      expect(client.get).toHaveBeenCalledWith('/portfolio/sync/status')
    })
  })

  describe('analysisAPI — backtest, score e CRUD de alertas', () => {
    it('getBacktesting e getScenarioSimulation postam o payload bruto', async () => {
      await analysisAPI.getBacktesting({ strategy: 'graham' })
      await analysisAPI.getScenarioSimulation({ shock: -0.1 })

      expect(client.post).toHaveBeenCalledWith('/analysis/backtest', { strategy: 'graham' })
      expect(client.post).toHaveBeenCalledWith('/analysis/scenario', { shock: -0.1 })
    })

    it('getInvestmentScore e getFundamentalAnalysis usam o símbolo no path', async () => {
      await analysisAPI.getInvestmentScore('VALE3')
      await analysisAPI.getFundamentalAnalysis('VALE3')

      expect(client.get).toHaveBeenCalledWith('/analysis/score/VALE3')
      expect(client.get).toHaveBeenCalledWith('/analysis/fundamental/VALE3')
    })

    it('CRUD de configuração de alerta usa id no path', async () => {
      await analysisAPI.getAlertConfigurations()
      await analysisAPI.updateAlertConfiguration('cfg-1', { threshold: 10 })
      await analysisAPI.deleteAlertConfiguration('cfg-1')

      expect(client.get).toHaveBeenCalledWith('/analysis/alerts/configurations')
      expect(client.put).toHaveBeenCalledWith('/analysis/alerts/configurations/cfg-1', {
        threshold: 10
      })
      expect(client.delete).toHaveBeenCalledWith('/analysis/alerts/configurations/cfg-1')
    })
  })
})
