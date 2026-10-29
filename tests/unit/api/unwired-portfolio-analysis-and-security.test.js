import { describe, it, expect, beforeEach, vi } from 'vitest'
import client from '@/api/client'
import { analysisAPI } from '@/api/analysis'
import { authAPI } from '@/api/auth'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('API — análise de portfólio e GET de segurança sem fio na store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true } })
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('getPortfolioAnalysis POST /analysis/portfolio envia o payload da carteira', () => {
    const portfolioData = { holdings: ['PETR4', 'VALE3'], value: 125000 }
    analysisAPI.getPortfolioAnalysis(portfolioData)

    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.post).toHaveBeenCalledWith('/analysis/portfolio', portfolioData)
  })

  it('getSecuritySettings GET /auth/security não manda body', () => {
    authAPI.getSecuritySettings()

    expect(client.get).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith('/auth/security')
  })
})
