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

describe('API — deleteSavedAnalysis sem encode e getBenchmarkComparison com string', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
    client.delete.mockResolvedValue({ data: { success: true } })
  })

  it('deleteSavedAnalysis interpola run/2026-01 cru no path', () => {
    analysisAPI.deleteSavedAnalysis('run/2026-01')

    const url = client.delete.mock.calls[0][0]
    expect(url).toBe('/analysis/saved/run/2026-01')
    expect(url).not.toBe('/analysis/saved/run%2F2026-01')
    expect(url.split('/')).toEqual(['', 'analysis', 'saved', 'run', '2026-01'])
  })

  it('getBenchmarkComparison() default junta IBOV,CDI; string IBOV lança no .join', () => {
    portfolioAPI.getBenchmarkComparison()
    expect(client.get).toHaveBeenCalledWith('/portfolio/benchmark', {
      params: { benchmarks: 'IBOV,CDI' }
    })

    expect(() => portfolioAPI.getBenchmarkComparison('IBOV')).toThrow()
    expect(client.get).toHaveBeenCalledTimes(1)
  })
})
