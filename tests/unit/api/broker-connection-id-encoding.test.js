import { describe, it, expect, beforeEach, vi } from 'vitest'
import client from '@/api/client'
import { brokersAPI } from '@/api/brokers'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('API — IDs de corretora interpolados sem encodeURIComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
    client.post.mockResolvedValue({ data: { success: true, data: {} } })
    client.delete.mockResolvedValue({ data: { success: true } })
  })

  it('disconnectBroker interpola xp/acc-1 cru — a barra vira outro segmento', () => {
    brokersAPI.disconnectBroker('xp/acc-1')

    expect(client.delete).toHaveBeenCalledTimes(1)
    const url = client.delete.mock.calls[0][0]
    expect(url).toBe('/brokers/disconnect/xp/acc-1')
    expect(url).not.toBe('/brokers/disconnect/xp%2Facc-1')
    expect(url.split('/')).toEqual(['', 'brokers', 'disconnect', 'xp', 'acc-1'])
  })

  it('syncBroker e testConnection interpolam clear/123 sem encode', () => {
    brokersAPI.syncBroker('clear/123')
    brokersAPI.testConnection('clear/123')

    const syncUrl = client.post.mock.calls[0][0]
    const testUrl = client.post.mock.calls[1][0]
    expect(syncUrl).toBe('/brokers/sync/clear/123')
    expect(testUrl).toBe('/brokers/test/clear/123')
    expect(syncUrl).not.toBe('/brokers/sync/clear%2F123')
    expect(testUrl).not.toBe('/brokers/test/clear%2F123')
  })

  it('getBrokerPositions interpola id com barra no path do GET', () => {
    brokersAPI.getBrokerPositions('rico/conta#1')

    expect(client.get).toHaveBeenCalledTimes(1)
    const url = client.get.mock.calls[0][0]
    expect(url).toBe('/brokers/positions/rico/conta#1')
    expect(url).not.toBe('/brokers/positions/rico%2Fconta%231')
    expect(url.split('/')).toEqual(['', 'brokers', 'positions', 'rico', 'conta#1'])
  })
})
