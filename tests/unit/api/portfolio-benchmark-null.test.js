import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

import { portfolioAPI } from '@/api/portfolio'
import client from '@/api/client'

describe('portfolioAPI — join de benchmarks nulos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getBenchmarkComparison(null) lança TypeError e não chama a API', () => {
    expect(() => portfolioAPI.getBenchmarkComparison(null)).toThrow(TypeError)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('sem argumentos usa IBOV e CDI', () => {
    portfolioAPI.getBenchmarkComparison()

    expect(client.get).toHaveBeenCalledWith('/portfolio/benchmark', {
      params: { benchmarks: 'IBOV,CDI' }
    })
  })
})
