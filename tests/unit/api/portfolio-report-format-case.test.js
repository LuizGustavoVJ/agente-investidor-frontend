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
import { portfolioAPI } from '@/api/portfolio'

describe('portfolioAPI.getConsolidatedReport — responseType depende de "pdf" minúsculo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
  })

  it('format "pdf" pede blob (binário)', async () => {
    await portfolioAPI.getConsolidatedReport('pdf')

    expect(client.get).toHaveBeenCalledWith('/portfolio/report', {
      params: { format: 'pdf' },
      responseType: 'blob'
    })
  })

  it('format "PDF" (comum em UI/export) pede json e tenta parsear binário', async () => {
    await portfolioAPI.getConsolidatedReport('PDF')

    expect(client.get).toHaveBeenCalledWith('/portfolio/report', {
      params: { format: 'PDF' },
      responseType: 'json'
    })
  })

  it('format "Pdf" também cai em json, não blob', async () => {
    await portfolioAPI.getConsolidatedReport('Pdf')

    expect(client.get.mock.calls[0][1].responseType).toBe('json')
  })
})
