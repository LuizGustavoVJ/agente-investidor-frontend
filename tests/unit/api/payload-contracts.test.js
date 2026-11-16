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
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'

describe('Contratos de payload das APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
    client.put.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
  })

  describe('authAPI', () => {
    it('login descarta rememberMe e qualquer campo extra', async () => {
      await authAPI.login({
        email: 'ana@ex.com',
        password: 'segredo',
        rememberMe: true,
        deviceId: 'browser-1'
      })

      expect(client.post).toHaveBeenCalledWith('/auth/login', {
        email: 'ana@ex.com',
        password: 'segredo'
      })
    })

    it('register não envia acceptMarketing', async () => {
      await authAPI.register({
        name: 'Ana',
        email: 'ana@ex.com',
        password: 'Senha123!',
        confirmPassword: 'Senha123!',
        phone: '(11) 99999-9999',
        acceptTerms: true,
        acceptMarketing: true
      })

      expect(client.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Ana',
        email: 'ana@ex.com',
        password: 'Senha123!',
        confirmPassword: 'Senha123!',
        phone: '(11) 99999-9999',
        acceptTerms: true
      })
      expect(client.post.mock.calls[0][1]).not.toHaveProperty('acceptMarketing')
    })

    it('changePassword envia current, new e confirm', async () => {
      await authAPI.changePassword({
        currentPassword: 'old',
        newPassword: 'new-secret',
        confirmPassword: 'new-secret',
        extra: true
      })

      expect(client.put).toHaveBeenCalledWith('/auth/password', {
        currentPassword: 'old',
        newPassword: 'new-secret',
        confirmPassword: 'new-secret'
      })
    })
  })

  describe('brokersAPI', () => {
    it('interpola connectionId cru na URL, inclusive com barra', async () => {
      await brokersAPI.disconnectBroker('xp/1')
      await brokersAPI.testConnection('xp/1')
      await brokersAPI.syncBroker('xp 1')

      expect(client.delete).toHaveBeenCalledWith('/brokers/disconnect/xp/1')
      expect(client.post).toHaveBeenCalledWith('/brokers/test/xp/1')
      expect(client.post).toHaveBeenCalledWith('/brokers/sync/xp 1')
    })

    it('getSyncStatus sem id usa o endpoint agregado', async () => {
      await brokersAPI.getSyncStatus()
      await brokersAPI.getSyncStatus('abc')

      expect(client.get).toHaveBeenNthCalledWith(1, '/brokers/sync/status')
      expect(client.get).toHaveBeenNthCalledWith(2, '/brokers/sync/status/abc')
    })

    it('connectBroker envia só brokerId, credentials e accountType', async () => {
      await brokersAPI.connectBroker({
        brokerId: 'xp',
        credentials: { apiKey: 'k' },
        accountType: 'real',
        nickname: 'Minha XP'
      })

      expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
        brokerId: 'xp',
        credentials: { apiKey: 'k' },
        accountType: 'real'
      })
    })
  })

  describe('portfolioAPI', () => {
    it('getBenchmarkComparison junta a lista com vírgula', async () => {
      await portfolioAPI.getBenchmarkComparison(['IBOV', 'CDI', 'SP500'])

      expect(client.get).toHaveBeenCalledWith('/portfolio/benchmark', {
        params: { benchmarks: 'IBOV,CDI,SP500' }
      })
    })

    it('getConsolidatedReport usa blob só para pdf', async () => {
      await portfolioAPI.getConsolidatedReport('pdf')
      await portfolioAPI.getConsolidatedReport('json')

      expect(client.get).toHaveBeenNthCalledWith(1, '/portfolio/report', {
        params: { format: 'pdf' },
        responseType: 'blob'
      })
      expect(client.get).toHaveBeenNthCalledWith(2, '/portfolio/report', {
        params: { format: 'json' },
        responseType: 'json'
      })
    })

    it('interpola símbolo cru em getAssetDetails', async () => {
      await portfolioAPI.getAssetDetails('PETR4.SA')

      expect(client.get).toHaveBeenCalledWith('/portfolio/assets/PETR4.SA')
    })
  })

  describe('analysisAPI', () => {
    it('getAssetAnalysis junta metodologias; lista vazia vira string vazia', async () => {
      await analysisAPI.getAssetAnalysis('VALE3', ['graham', 'buffett'])
      await analysisAPI.getAssetAnalysis('VALE3')

      expect(client.get).toHaveBeenNthCalledWith(1, '/analysis/asset/VALE3', {
        params: { methodologies: 'graham,buffett' }
      })
      expect(client.get).toHaveBeenNthCalledWith(2, '/analysis/asset/VALE3', {
        params: { methodologies: '' }
      })
    })

    it('runAnalysis envia methodology e parameters', async () => {
      await analysisAPI.runAnalysis('value', { minPe: 10 })

      expect(client.post).toHaveBeenCalledWith('/methodology/analyze', {
        methodology: 'value',
        parameters: { minPe: 10 }
      })
    })
  })
})
