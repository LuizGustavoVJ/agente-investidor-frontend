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

describe('API — notificações, capabilities e sync-config de corretora sem encodeURIComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
    client.put.mockResolvedValue({ data: { success: true } })
  })

  it('configureBrokerNotifications e getNotificationConfiguration interpolam xp/acc-1 cru', () => {
    brokersAPI.configureBrokerNotifications('xp/acc-1', { email: true })
    brokersAPI.getNotificationConfiguration('xp/acc-1')

    const putUrl = client.put.mock.calls[0][0]
    const getUrl = client.get.mock.calls[0][0]
    expect(putUrl).toBe('/brokers/notifications/xp/acc-1')
    expect(getUrl).toBe('/brokers/notifications/xp/acc-1')
    expect(putUrl).not.toBe('/brokers/notifications/xp%2Facc-1')
    expect(getUrl).not.toBe('/brokers/notifications/xp%2Facc-1')
    expect(putUrl.split('/')).toEqual(['', 'brokers', 'notifications', 'xp', 'acc-1'])
  })

  it('getBrokerCapabilities interpola clear/123 sem encode', () => {
    brokersAPI.getBrokerCapabilities('clear/123')

    const url = client.get.mock.calls[0][0]
    expect(url).toBe('/brokers/capabilities/clear/123')
    expect(url).not.toBe('/brokers/capabilities/clear%2F123')
    expect(url.split('/')).toEqual(['', 'brokers', 'capabilities', 'clear', '123'])
  })

  it('getSyncConfiguration interpola rico/conta#1 e o hash corta o path', () => {
    brokersAPI.getSyncConfiguration('rico/conta#1')

    const url = client.get.mock.calls[0][0]
    expect(url).toBe('/brokers/auto-sync/rico/conta#1')
    expect(url).not.toBe('/brokers/auto-sync/rico%2Fconta%231')
    expect(url.includes('#')).toBe(true)
  })
})
