import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import { analysisAPI } from '@/api/analysis'
import { portfolioAPI } from '@/api/portfolio'
import client from '@/api/client'

describe('APIs — .join em segundo argumento string (não-array)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAssetAnalysis com methodology string lança TypeError e não chama a API', () => {
    expect(() => analysisAPI.getAssetAnalysis('PETR4', 'graham')).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('getTechnicalIndicators com indicator string lança TypeError e não chama a API', () => {
    expect(() => analysisAPI.getTechnicalIndicators('VALE3', 'rsi')).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('getBenchmarkComparison com benchmark string lança TypeError e não chama a API', () => {
    expect(() => portfolioAPI.getBenchmarkComparison('IBOV')).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('array de um item envia o join correto', () => {
    analysisAPI.getAssetAnalysis('PETR4', ['graham'])

    expect(client.get).toHaveBeenCalledWith('/analysis/asset/PETR4', {
      params: { methodologies: 'graham' }
    })
  })
})
