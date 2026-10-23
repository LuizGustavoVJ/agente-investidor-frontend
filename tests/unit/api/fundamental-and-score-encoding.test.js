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

describe('API — getFundamentalAnalysis e getInvestmentScore sem encodeURIComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
    client.post.mockResolvedValue({ data: { success: true, data: {} } })
  })

  it('getFundamentalAnalysis interpola PETR4/SA cru — a barra vira outro segmento', () => {
    analysisAPI.getFundamentalAnalysis('PETR4/SA')

    expect(client.get).toHaveBeenCalledTimes(1)
    const url = client.get.mock.calls[0][0]
    expect(url).toBe('/analysis/fundamental/PETR4/SA')
    expect(url).not.toBe('/analysis/fundamental/PETR4%2FSA')
    expect(url.split('/')).toEqual(['', 'analysis', 'fundamental', 'PETR4', 'SA'])
  })

  it('getInvestmentScore interpola VALE3/SA sem encode', () => {
    analysisAPI.getInvestmentScore('VALE3/SA')

    expect(client.get).toHaveBeenCalledTimes(1)
    const url = client.get.mock.calls[0][0]
    expect(url).toBe('/analysis/score/VALE3/SA')
    expect(url).not.toBe('/analysis/score/VALE3%2FSA')
    expect(url.split('/')).toEqual(['', 'analysis', 'score', 'VALE3', 'SA'])
  })

  it('shareAnalysis interpola id com barra no path do POST', () => {
    analysisAPI.shareAnalysis('abc/def', { visibility: 'public' })

    expect(client.post).toHaveBeenCalledTimes(1)
    const url = client.post.mock.calls[0][0]
    expect(url).toBe('/analysis/share/abc/def')
    expect(url).not.toBe('/analysis/share/abc%2Fdef')
    expect(client.post.mock.calls[0][1]).toEqual({ visibility: 'public' })
  })
})
