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
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'
import { brokersAPI } from '@/api/brokers'

describe('Contratos de payload, URL e blob das APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
    client.put.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
  })

  it('login envia só email/password e descarta rememberMe', async () => {
    await authAPI.login({
      email: 'a@b.com',
      password: 'segredo',
      rememberMe: true,
      extra: 'drop'
    })

    expect(client.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.com',
      password: 'segredo'
    })
  })

  it('runAnalysis posta methodology, não methodologyId', async () => {
    await analysisAPI.runAnalysis(99, { peMax: 15 })

    expect(client.post).toHaveBeenCalledWith('/methodology/analyze', {
      methodology: 99,
      parameters: { peMax: 15 }
    })
  })

  it('getAssetDetails interpola símbolo sem encodeURIComponent', async () => {
    await portfolioAPI.getAssetDetails('PETR4/ON')

    expect(client.get).toHaveBeenCalledWith('/portfolio/assets/PETR4/ON')
    expect(client.get.mock.calls[0][0]).not.toContain(encodeURIComponent('PETR4/ON'))
  })

  it('getTechnicalIndicators junta indicadores crus na query', async () => {
    await analysisAPI.getTechnicalIndicators('VALE3', ['RSI 14', 'MACD'])

    expect(client.get).toHaveBeenCalledWith('/analysis/technical/VALE3', {
      params: { indicators: 'RSI 14,MACD' }
    })
  })

  it('getConsolidatedReport usa blob só para pdf', async () => {
    await portfolioAPI.getConsolidatedReport()
    await portfolioAPI.getConsolidatedReport('pdf')
    await portfolioAPI.getConsolidatedReport('csv')

    expect(client.get).toHaveBeenNthCalledWith(1, '/portfolio/report', {
      params: { format: 'json' },
      responseType: 'json'
    })
    expect(client.get).toHaveBeenNthCalledWith(2, '/portfolio/report', {
      params: { format: 'pdf' },
      responseType: 'blob'
    })
    expect(client.get).toHaveBeenNthCalledWith(3, '/portfolio/report', {
      params: { format: 'csv' },
      responseType: 'json'
    })
  })

  it('updateCredentials envia o objeto de credenciais cru como body', async () => {
    const credentials = { apiKey: 'k', apiSecret: 's' }
    await brokersAPI.updateCredentials('conn-1', credentials)

    expect(client.put).toHaveBeenCalledWith('/brokers/credentials/conn-1', credentials)
  })

  it('getSharedAnalysis interpola o token na URL sem encode', async () => {
    await analysisAPI.getSharedAnalysis('abc/def+token')

    expect(client.get).toHaveBeenCalledWith('/analysis/shared/abc/def+token')
  })

  it('connectBroker só envia brokerId, credentials e accountType', async () => {
    await brokersAPI.connectBroker({
      brokerId: 'xp',
      credentials: { user: 'u' },
      accountType: 'pf',
      nickname: 'Minha XP',
      cpf: '000'
    })

    expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
      brokerId: 'xp',
      credentials: { user: 'u' },
      accountType: 'pf'
    })
  })
})
