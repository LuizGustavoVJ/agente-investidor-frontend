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

describe('API — paths operacionais de corretora sem encodeURIComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
    client.post.mockResolvedValue({ data: { success: true, data: {} } })
    client.put.mockResolvedValue({ data: { success: true } })
  })

  it('resolveDataConflict e validateImportedData interpolam xp/acc-1 cru', () => {
    brokersAPI.resolveDataConflict('xp/acc-1', { action: 'keep-local' })
    brokersAPI.validateImportedData('xp/acc-1', { strict: true })

    const conflictUrl = client.post.mock.calls[0][0]
    const validateUrl = client.post.mock.calls[1][0]
    expect(conflictUrl).toBe('/brokers/conflicts/xp/acc-1/resolve')
    expect(validateUrl).toBe('/brokers/validate/xp/acc-1')
    expect(conflictUrl).not.toBe('/brokers/conflicts/xp%2Facc-1/resolve')
    expect(validateUrl).not.toBe('/brokers/validate/xp%2Facc-1')
    expect(conflictUrl.split('/')).toEqual(['', 'brokers', 'conflicts', 'xp', 'acc-1', 'resolve'])
  })

  it('getImportReport e exportToBroker interpolam clear/123 sem encode', () => {
    brokersAPI.getImportReport('clear/123')
    brokersAPI.exportToBroker('clear/123', { format: 'csv' })

    const reportUrl = client.get.mock.calls[0][0]
    const exportUrl = client.post.mock.calls[0][0]
    expect(reportUrl).toBe('/brokers/import/report/clear/123')
    expect(exportUrl).toBe('/brokers/export/clear/123')
    expect(reportUrl).not.toBe('/brokers/import/report/clear%2F123')
    expect(exportUrl.split('/')).toEqual(['', 'brokers', 'export', 'clear', '123'])
  })

  it('getSyncStatus, configureAutoSync e getConnectionLogs interpolam id com barra e hash', () => {
    brokersAPI.getSyncStatus('rico/conta#1')
    brokersAPI.configureAutoSync('rico/conta#1', { enabled: true, interval: '1h' })
    brokersAPI.getConnectionLogs('rico/conta#1', { level: 'error' })

    const statusUrl = client.get.mock.calls[0][0]
    const logsUrl = client.get.mock.calls[1][0]
    const autoUrl = client.put.mock.calls[0][0]
    expect(statusUrl).toBe('/brokers/sync/status/rico/conta#1')
    expect(logsUrl).toBe('/brokers/logs/rico/conta#1')
    expect(autoUrl).toBe('/brokers/auto-sync/rico/conta#1')
    expect(statusUrl).not.toBe('/brokers/sync/status/rico%2Fconta%231')
    expect(autoUrl).not.toBe('/brokers/auto-sync/rico%2Fconta%231')
  })
})
