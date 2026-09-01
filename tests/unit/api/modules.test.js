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

describe('Contratos das APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
    client.put.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
  })

  describe('authAPI', () => {
    it('login envia apenas email e senha', async () => {
      await authAPI.login({
        email: 'joao@email.com',
        password: 'secret',
        extra: 'nao-deve-ir'
      })

      expect(client.post).toHaveBeenCalledWith('/auth/login', {
        email: 'joao@email.com',
        password: 'secret'
      })
    })

    it('register mapeia campos de cadastro incluindo aceite de termos', async () => {
      await authAPI.register({
        name: 'João',
        email: 'joao@email.com',
        password: 'a',
        confirmPassword: 'a',
        phone: '11999999999',
        acceptTerms: true
      })

      expect(client.post).toHaveBeenCalledWith('/auth/register', {
        name: 'João',
        email: 'joao@email.com',
        password: 'a',
        confirmPassword: 'a',
        phone: '11999999999',
        acceptTerms: true
      })
    })

    it('changePassword e reset confirmam nova senha no payload', async () => {
      await authAPI.changePassword({
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new'
      })
      await authAPI.confirmPasswordReset({
        token: 'tok',
        newPassword: 'new',
        confirmPassword: 'new'
      })

      expect(client.put).toHaveBeenCalledWith('/auth/password', {
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new'
      })
      expect(client.post).toHaveBeenCalledWith('/auth/password/reset-confirm', {
        token: 'tok',
        newPassword: 'new',
        confirmPassword: 'new'
      })
    })

    it('verify2FA envia o código no corpo da request', async () => {
      await authAPI.verify2FA('123456')

      expect(client.post).toHaveBeenCalledWith('/auth/security/2fa/verify', { code: '123456' })
    })
  })

  describe('brokersAPI', () => {
    it('connectBroker envia brokerId, credentials e accountType', async () => {
      await brokersAPI.connectBroker({
        brokerId: 'xp',
        credentials: { token: 'abc' },
        accountType: 'checking',
        ignored: true
      })

      expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
        brokerId: 'xp',
        credentials: { token: 'abc' },
        accountType: 'checking'
      })
    })

    it('getSyncStatus usa path específico quando há connectionId', async () => {
      await brokersAPI.getSyncStatus()
      await brokersAPI.getSyncStatus('xp-1')

      expect(client.get).toHaveBeenNthCalledWith(1, '/brokers/sync/status')
      expect(client.get).toHaveBeenNthCalledWith(2, '/brokers/sync/status/xp-1')
    })

    it('resolveDataConflict posta a resolução no conflito certo', async () => {
      await brokersAPI.resolveDataConflict('c1', { action: 'keep_remote' })

      expect(client.post).toHaveBeenCalledWith(
        '/brokers/conflicts/c1/resolve',
        { action: 'keep_remote' }
      )
    })
  })

  describe('analysisAPI e portfolioAPI', () => {
    it('serializa listas de metodologias e indicadores como query string', async () => {
      await analysisAPI.getAssetAnalysis('PETR4', ['graham', 'buffett'])
      await analysisAPI.getTechnicalIndicators('VALE3', ['RSI', 'MACD'])

      expect(client.get).toHaveBeenCalledWith('/analysis/asset/PETR4', {
        params: { methodologies: 'graham,buffett' }
      })
      expect(client.get).toHaveBeenCalledWith('/analysis/technical/VALE3', {
        params: { indicators: 'RSI,MACD' }
      })
    })

    it('runAnalysis envia methodology e parameters no corpo', async () => {
      await analysisAPI.runAnalysis('graham', { minMargin: 0.3 })

      expect(client.post).toHaveBeenCalledWith('/methodology/analyze', {
        methodology: 'graham',
        parameters: { minMargin: 0.3 }
      })
    })

    it('getBenchmarkComparison junta benchmarks e getConsolidatedReport usa blob em PDF', async () => {
      await portfolioAPI.getBenchmarkComparison(['IBOV', 'CDI', 'IPCA'])
      await portfolioAPI.getConsolidatedReport('pdf')
      await portfolioAPI.getConsolidatedReport('json')

      expect(client.get).toHaveBeenCalledWith('/portfolio/benchmark', {
        params: { benchmarks: 'IBOV,CDI,IPCA' }
      })
      expect(client.get).toHaveBeenCalledWith('/portfolio/report', {
        params: { format: 'pdf' },
        responseType: 'blob'
      })
      expect(client.get).toHaveBeenCalledWith('/portfolio/report', {
        params: { format: 'json' },
        responseType: 'json'
      })
    })
  })
})
