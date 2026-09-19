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
import client from '@/api/client'

describe('analysisAPI — join em metodologias/indicadores nulos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAssetAnalysis com methodologies null lança TypeError e não chama a API', () => {
    expect(() => analysisAPI.getAssetAnalysis('PETR4', null)).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('getTechnicalIndicators com indicators null lança TypeError e não chama a API', () => {
    expect(() => analysisAPI.getTechnicalIndicators('VALE3', null)).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('omissão do segundo argumento usa [] e envia string vazia', () => {
    analysisAPI.getAssetAnalysis('PETR4')

    expect(client.get).toHaveBeenCalledWith('/analysis/asset/PETR4', {
      params: { methodologies: '' }
    })
  })
})
