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
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'
import { brokersAPI } from '@/api/brokers'
import { authAPI } from '@/api/auth'

describe('API: mutações restantes encaminham body cru e interpolam IDs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
    client.post.mockResolvedValue({ data: { success: true, data: {} } })
    client.put.mockResolvedValue({ data: { success: true, data: {} } })
    client.delete.mockResolvedValue({ data: { success: true } })
  })

  it('updateTransaction posta o objeto cru e interpola o id sem encode', async () => {
    const payload = { quantity: 10, price: 32.1, userId: 'injected', note: '<script>' }
    await portfolioAPI.updateTransaction('PETR4/2024', payload)

    expect(client.put).toHaveBeenCalledWith('/portfolio/transactions/PETR4/2024', payload)
  })

  it('deleteTransaction interpola o id cru na URL', async () => {
    await portfolioAPI.deleteTransaction('../admin')

    expect(client.delete).toHaveBeenCalledWith('/portfolio/transactions/../admin')
  })

  it('getAssetDetails interpola o símbolo sem encodeURIComponent', async () => {
    await portfolioAPI.getAssetDetails('PETR4.SA/extra')

    expect(client.get).toHaveBeenCalledWith('/portfolio/assets/PETR4.SA/extra')
  })

  it('análises custom/portfólio/cenário/alertas postam o caller inteiro', async () => {
    const custom = { methodology: 'value', secrets: { token: 'abc' } }
    const portfolio = { holdings: [], userId: 99 }
    const scenario = { crash: true, credentials: 'plain' }
    const alerts = { webhook: 'https://evil.test', enabled: true }

    await analysisAPI.runCustomAnalysis(custom)
    await analysisAPI.getPortfolioAnalysis(portfolio)
    await analysisAPI.getScenarioSimulation(scenario)
    await analysisAPI.configureAlerts(alerts)

    expect(client.post).toHaveBeenCalledWith('/analysis/custom', custom)
    expect(client.post).toHaveBeenCalledWith('/analysis/portfolio', portfolio)
    expect(client.post).toHaveBeenCalledWith('/analysis/scenario', scenario)
    expect(client.post).toHaveBeenCalledWith('/analysis/alerts/configure', alerts)
  })

  it('corretoras encaminham config/validação/notificação cruas', async () => {
    const config = { interval: 60, password: 'broker-secret' }
    const rules = { overwrite: true, account: '123' }
    const notifications = { email: true, smsToken: 'raw' }

    await brokersAPI.configureAutoSync('xp-1', config)
    await brokersAPI.validateImportedData('xp-1', rules)
    await brokersAPI.configureBrokerNotifications('xp-1', notifications)

    expect(client.put).toHaveBeenCalledWith('/brokers/auto-sync/xp-1', config)
    expect(client.post).toHaveBeenCalledWith('/brokers/validate/xp-1', rules)
    expect(client.put).toHaveBeenCalledWith('/brokers/notifications/xp-1', notifications)
  })

  it('updateProfile envia o objeto inteiro, inclusive campos extras', async () => {
    const profile = {
      firstName: 'Ana',
      role: 'admin',
      twoFactorSecret: 'otpauth'
    }

    await authAPI.updateProfile(profile)

    expect(client.put).toHaveBeenCalledWith('/auth/profile', profile)
  })
})
