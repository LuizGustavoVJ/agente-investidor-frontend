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

describe('API — getAssetDetails e getSectorAnalysis sem encodeURIComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
  })

  it('getAssetDetails interpola PETR4/SA cru — a barra vira outro segmento de path', () => {
    portfolioAPI.getAssetDetails('PETR4/SA')

    expect(client.get).toHaveBeenCalledTimes(1)
    const url = client.get.mock.calls[0][0]
    expect(url).toBe('/portfolio/assets/PETR4/SA')
    expect(url).not.toBe('/portfolio/assets/PETR4%2FSA')
    expect(url.split('/')).toEqual(['', 'portfolio', 'assets', 'PETR4', 'SA'])
  })

  it('getSectorAnalysis interpola setor com espaço e barra sem encode', () => {
    analysisAPI.getSectorAnalysis('Bens / Capital')

    expect(client.get).toHaveBeenCalledTimes(1)
    const url = client.get.mock.calls[0][0]
    expect(url).toBe('/analysis/sector/Bens / Capital')
    expect(url).not.toBe('/analysis/sector/Bens%20%2F%20Capital')
  })

  it('getSharedAnalysis interpola o token com barra sem encode', () => {
    analysisAPI.getSharedAnalysis('abc/def+ghi')

    expect(client.get).toHaveBeenCalledTimes(1)
    expect(client.get.mock.calls[0][0]).toBe('/analysis/shared/abc/def+ghi')
    expect(client.get.mock.calls[0][0]).not.toBe('/analysis/shared/abc%2Fdef%2Bghi')
  })
})
