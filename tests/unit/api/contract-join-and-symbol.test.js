import { describe, it, expect, beforeEach, vi } from 'vitest'
import client from '@/api/client'
import { analysisAPI } from '@/api/analysis'
import { portfolioAPI } from '@/api/portfolio'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('API — join em string e símbolo sem encode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
  })

  it('getAssetAnalysis com methodologies string lança no join e não chama o client', () => {
    expect(() => analysisAPI.getAssetAnalysis('PETR4', 'value')).toThrow(/join is not a function/)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('getAssetAnalysis interpola o símbolo cru na URL — barra não é encoded', () => {
    analysisAPI.getAssetAnalysis('PETR4/SA', ['value'])

    expect(client.get).toHaveBeenCalledTimes(1)
    const [url, config] = client.get.mock.calls[0]
    expect(url).toBe('/analysis/asset/PETR4/SA')
    expect(url).not.toBe('/analysis/asset/PETR4%2FSA')
    expect(config.params.methodologies).toBe('value')
  })

  it('getBenchmarkComparison com ticker string lança no join e não chama o client', () => {
    expect(() => portfolioAPI.getBenchmarkComparison('IBOV')).toThrow(/join is not a function/)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('getTechnicalIndicators com indicators string também lança no join', () => {
    expect(() => analysisAPI.getTechnicalIndicators('VALE3', 'rsi')).toThrow(/join is not a function/)
    expect(client.get).not.toHaveBeenCalled()
  })
})
