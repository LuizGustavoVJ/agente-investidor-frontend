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
import { analysisAPI } from '@/api/analysis'
import { brokersAPI } from '@/api/brokers'

describe('API: lookups restantes interpolam IDs crus e posts de risco/backtest vão inteiros', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
    client.post.mockResolvedValue({ data: { success: true, data: {} } })
    client.put.mockResolvedValue({ data: { success: true, data: {} } })
    client.delete.mockResolvedValue({ data: { success: true } })
  })

  it('análises de setor/técnico/fundamental/score/resultado interpolam o path sem encode', async () => {
    await analysisAPI.getSectorAnalysis('energia/petroleo')
    await analysisAPI.getTechnicalIndicators('PETR4.SA/extra', ['rsi', 'macd'])
    await analysisAPI.getFundamentalAnalysis('VALE3#1')
    await analysisAPI.getInvestmentScore('ITUB4?x=1')
    await analysisAPI.getAnalysisResults('../admin')

    expect(client.get).toHaveBeenCalledWith('/analysis/sector/energia/petroleo')
    expect(client.get).toHaveBeenCalledWith('/analysis/technical/PETR4.SA/extra', {
      params: { indicators: 'rsi,macd' }
    })
    expect(client.get).toHaveBeenCalledWith('/analysis/fundamental/VALE3#1')
    expect(client.get).toHaveBeenCalledWith('/analysis/score/ITUB4?x=1')
    expect(client.get).toHaveBeenCalledWith('/methodology/results/../admin')
  })

  it('update/delete de configuração de alerta interpolam configId cru', async () => {
    const patch = { webhook: 'https://evil.test', enabled: true }
    await analysisAPI.updateAlertConfiguration('cfg/1', patch)
    await analysisAPI.deleteAlertConfiguration('../cfg')

    expect(client.put).toHaveBeenCalledWith('/analysis/alerts/configurations/cfg/1', patch)
    expect(client.delete).toHaveBeenCalledWith('/analysis/alerts/configurations/../cfg')
  })

  it('getRiskReturnAnalysis e getBacktesting postam o objeto do caller sem sanitizar', async () => {
    const portfolio = { holdings: [], secrets: { token: 'abc' } }
    const strategy = { rules: [], credentials: 'plain' }

    await analysisAPI.getRiskReturnAnalysis(portfolio)
    await analysisAPI.getBacktesting(strategy)

    expect(client.post).toHaveBeenCalledWith('/analysis/risk-return', portfolio)
    expect(client.post).toHaveBeenCalledWith('/analysis/backtest', strategy)
  })

  it('lookups de corretora interpolam connectionId/brokerId/importId crus', async () => {
    await brokersAPI.getBrokerPositions('xp/1')
    await brokersAPI.getBrokerBalance('xp/1')
    await brokersAPI.getBrokerFees('xp/1')
    await brokersAPI.getAccountInfo('xp/1')
    await brokersAPI.getConnectionLogs('../logs', { level: 'debug' })
    await brokersAPI.getImportReport('rep/../admin')
    await brokersAPI.getBrokerCapabilities('xp?role=admin')
    await brokersAPI.getSyncConfiguration('xp/1')
    await brokersAPI.getNotificationConfiguration('xp/1')

    expect(client.get).toHaveBeenCalledWith('/brokers/positions/xp/1')
    expect(client.get).toHaveBeenCalledWith('/brokers/balance/xp/1')
    expect(client.get).toHaveBeenCalledWith('/brokers/fees/xp/1')
    expect(client.get).toHaveBeenCalledWith('/brokers/account/xp/1')
    expect(client.get).toHaveBeenCalledWith('/brokers/logs/../logs', {
      params: { level: 'debug' }
    })
    expect(client.get).toHaveBeenCalledWith('/brokers/import/report/rep/../admin')
    expect(client.get).toHaveBeenCalledWith('/brokers/capabilities/xp?role=admin')
    expect(client.get).toHaveBeenCalledWith('/brokers/auto-sync/xp/1')
    expect(client.get).toHaveBeenCalledWith('/brokers/notifications/xp/1')
  })
})
