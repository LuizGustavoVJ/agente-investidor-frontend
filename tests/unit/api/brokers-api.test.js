import { describe, it, expect, beforeEach, vi } from 'vitest'
import client from '@/api/client'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('brokersAPI — URLs e payloads de conexão', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
    client.get.mockResolvedValue({ data: { success: true } })
    client.put.mockResolvedValue({ data: { success: true } })
    client.delete.mockResolvedValue({ data: { success: true } })
  })

  it('connectBroker envia brokerId, credentials e accountType', async () => {
    await brokersAPI.connectBroker({
      brokerId: 'xp',
      credentials: { apiKey: 'k', secret: 's' },
      accountType: 'conta-corrente',
      extra: 'ignorado'
    })

    expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
      brokerId: 'xp',
      credentials: { apiKey: 'k', secret: 's' },
      accountType: 'conta-corrente'
    })
  })

  it('interpola connectionId em disconnect, test e sync', async () => {
    await brokersAPI.disconnectBroker('id-1')
    await brokersAPI.testConnection('id-1')
    await brokersAPI.syncBroker('id-1')

    expect(client.delete).toHaveBeenCalledWith('/brokers/disconnect/id-1')
    expect(client.post).toHaveBeenCalledWith('/brokers/test/id-1')
    expect(client.post).toHaveBeenCalledWith('/brokers/sync/id-1')
  })

  it('getSyncStatus altera a URL quando há connectionId', async () => {
    await brokersAPI.getSyncStatus()
    await brokersAPI.getSyncStatus('xp-1')

    expect(client.get).toHaveBeenNthCalledWith(1, '/brokers/sync/status')
    expect(client.get).toHaveBeenNthCalledWith(2, '/brokers/sync/status/xp-1')
  })

  it('encaminha filtros como query params no histórico e transações', async () => {
    await brokersAPI.getSyncHistory('xp-1', { from: '2026-01-01' })
    await brokersAPI.getBrokerTransactions('xp-1', { type: 'buy' })
    await brokersAPI.getBrokerStatement('xp-1', '2026-01')

    expect(client.get).toHaveBeenCalledWith('/brokers/sync/history/xp-1', {
      params: { from: '2026-01-01' }
    })
    expect(client.get).toHaveBeenCalledWith('/brokers/transactions/xp-1', {
      params: { type: 'buy' }
    })
    expect(client.get).toHaveBeenCalledWith('/brokers/statement/xp-1', {
      params: { period: '2026-01' }
    })
  })

  it('resolveDataConflict posta a resolução no id do conflito', async () => {
    await brokersAPI.resolveDataConflict('c-9', { strategy: 'keep-remote' })

    expect(client.post).toHaveBeenCalledWith(
      '/brokers/conflicts/c-9/resolve',
      { strategy: 'keep-remote' }
    )
  })
})
