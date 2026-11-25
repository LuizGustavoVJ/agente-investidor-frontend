import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import client from '@/api/client'
import { analysisAPI } from '@/api/analysis'
import { portfolioAPI } from '@/api/portfolio'
import { brokersAPI } from '@/api/brokers'

describe('API: join vazio e period undefined vazam para o backend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
  })

  it('getAssetAnalysis com array vazio manda methodologies como string vazia, não omite o param', async () => {
    await analysisAPI.getAssetAnalysis('PETR4', [])

    expect(client.get).toHaveBeenCalledWith('/analysis/asset/PETR4', {
      params: { methodologies: '' }
    })
  })

  it('getTechnicalIndicators com array vazio manda indicators como string vazia', async () => {
    await analysisAPI.getTechnicalIndicators('VALE3', [])

    expect(client.get).toHaveBeenCalledWith('/analysis/technical/VALE3', {
      params: { indicators: '' }
    })
  })

  it('getBenchmarkComparison([]) manda benchmarks="" em vez do default IBOV,CDI', async () => {
    await portfolioAPI.getBenchmarkComparison([])

    expect(client.get).toHaveBeenCalledWith('/portfolio/benchmark', {
      params: { benchmarks: '' }
    })
  })

  it('getBrokerStatement sem period ainda envia params.period undefined', async () => {
    await brokersAPI.getBrokerStatement('xp-1')

    expect(client.get).toHaveBeenCalledWith('/brokers/statement/xp-1', {
      params: { period: undefined }
    })
  })
})
