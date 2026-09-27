import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

import { portfolioAPI } from '@/api/portfolio'
import client from '@/api/client'

describe('portfolioAPI — period null/vazio ignora o default 1Y', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getEvolution() sem argumento envia period 1Y', () => {
    portfolioAPI.getEvolution()

    expect(client.get).toHaveBeenCalledWith('/portfolio/evolution', {
      params: { period: '1Y' }
    })
  })

  it('getEvolution(null) envia period null em vez do default 1Y', () => {
    portfolioAPI.getEvolution(null)

    expect(client.get).toHaveBeenCalledWith('/portfolio/evolution', {
      params: { period: null }
    })
  })

  it('getEvolution("") envia period vazio em vez do default 1Y', () => {
    portfolioAPI.getEvolution('')

    expect(client.get).toHaveBeenCalledWith('/portfolio/evolution', {
      params: { period: '' }
    })
  })

  it('getPerformance(null) envia period null em vez do default 1Y', () => {
    portfolioAPI.getPerformance(null)

    expect(client.get).toHaveBeenCalledWith('/portfolio/performance', {
      params: { period: null }
    })
  })
})
