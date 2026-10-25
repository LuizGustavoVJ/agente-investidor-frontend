import { describe, it, expect, beforeEach, vi } from 'vitest'
import client from '@/api/client'
import { analysisAPI } from '@/api/analysis'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('API — resultados e config de alerta interpolados sem encode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
    client.put.mockResolvedValue({ data: { success: true } })
    client.delete.mockResolvedValue({ data: { success: true } })
  })

  it('getAnalysisResults interpola run/2026-01 sem encodeURIComponent', () => {
    analysisAPI.getAnalysisResults('run/2026-01')

    const url = client.get.mock.calls[0][0]
    expect(url).toBe('/methodology/results/run/2026-01')
    expect(url).not.toBe('/methodology/results/run%2F2026-01')
    expect(url.split('/')).toEqual(['', 'methodology', 'results', 'run', '2026-01'])
  })

  it('markAlertAsRead interpola alerta com barra no path', () => {
    analysisAPI.markAlertAsRead('critico/caixa-1')

    const url = client.put.mock.calls[0][0]
    expect(url).toBe('/analysis/alerts/critico/caixa-1/read')
    expect(url).not.toBe('/analysis/alerts/critico%2Fcaixa-1/read')
  })

  it('updateAlertConfiguration e deleteAlertConfiguration interpolam cfg/rsi#1 cru', () => {
    analysisAPI.updateAlertConfiguration('cfg/rsi#1', { enabled: false })
    analysisAPI.deleteAlertConfiguration('cfg/rsi#1')

    const putUrl = client.put.mock.calls[0][0]
    const delUrl = client.delete.mock.calls[0][0]
    expect(putUrl).toBe('/analysis/alerts/configurations/cfg/rsi#1')
    expect(delUrl).toBe('/analysis/alerts/configurations/cfg/rsi#1')
    expect(putUrl).not.toBe('/analysis/alerts/configurations/cfg%2Frsi%231')
  })
})
