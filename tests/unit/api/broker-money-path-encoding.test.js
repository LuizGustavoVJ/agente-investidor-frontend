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

describe('API — paths financeiros de corretora sem encodeURIComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
    client.post.mockResolvedValue({ data: { success: true, data: {} } })
    client.put.mockResolvedValue({ data: { success: true } })
  })

  it('getBrokerTransactions e getBrokerBalance interpolam xp/acc-1 cru', () => {
    brokersAPI.getBrokerTransactions('xp/acc-1')
    brokersAPI.getBrokerBalance('xp/acc-1')

    const txUrl = client.get.mock.calls[0][0]
    const balUrl = client.get.mock.calls[1][0]
    expect(txUrl).toBe('/brokers/transactions/xp/acc-1')
    expect(balUrl).toBe('/brokers/balance/xp/acc-1')
    expect(txUrl).not.toBe('/brokers/transactions/xp%2Facc-1')
    expect(balUrl).not.toBe('/brokers/balance/xp%2Facc-1')
    expect(txUrl.split('/')).toEqual(['', 'brokers', 'transactions', 'xp', 'acc-1'])
  })

  it('getBrokerStatement e getAccountInfo interpolam clear/123 sem encode', () => {
    brokersAPI.getBrokerStatement('clear/123', '1M')
    brokersAPI.getAccountInfo('clear/123')

    const stmtUrl = client.get.mock.calls[0][0]
    const acctUrl = client.get.mock.calls[1][0]
    expect(stmtUrl).toBe('/brokers/statement/clear/123')
    expect(acctUrl).toBe('/brokers/account/clear/123')
    expect(stmtUrl).not.toBe('/brokers/statement/clear%2F123')
  })

  it('getBrokerFees, getSyncHistory e updateCredentials interpolam id com barra e hash', () => {
    brokersAPI.getBrokerFees('rico/conta#1')
    brokersAPI.getSyncHistory('rico/conta#1')
    brokersAPI.updateCredentials('rico/conta#1', { token: 'abc' })

    const feesUrl = client.get.mock.calls[0][0]
    const histUrl = client.get.mock.calls[1][0]
    const credUrl = client.put.mock.calls[0][0]
    expect(feesUrl).toBe('/brokers/fees/rico/conta#1')
    expect(histUrl).toBe('/brokers/sync/history/rico/conta#1')
    expect(credUrl).toBe('/brokers/credentials/rico/conta#1')
    expect(feesUrl).not.toBe('/brokers/fees/rico%2Fconta%231')
  })
})
