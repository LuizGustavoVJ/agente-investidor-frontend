import { describe, it, expect, beforeEach, vi } from 'vitest'

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}))

vi.mock('@/api/client', () => ({
  default: client
}))

import { analysisAPI } from '@/api/analysis'
import { portfolioAPI } from '@/api/portfolio'

describe('APIs — .join em argumento string/nulo quebra a chamada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
  })

  it('getAssetAnalysis com methodologies string lança TypeError em .join', () => {
    expect(() => analysisAPI.getAssetAnalysis('PETR4', 'graham')).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('getAssetAnalysis com methodologies null lança TypeError', () => {
    expect(() => analysisAPI.getAssetAnalysis('PETR4', null)).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('getTechnicalIndicators com indicators string lança TypeError em .join', () => {
    expect(() => analysisAPI.getTechnicalIndicators('VALE3', 'rsi')).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('getBenchmarkComparison com string lança TypeError em vez de consultar IBOV', () => {
    expect(() => portfolioAPI.getBenchmarkComparison('IBOV')).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })
})
