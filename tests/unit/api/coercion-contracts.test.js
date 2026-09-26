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
import { authAPI } from '@/api/auth'
import { portfolioAPI } from '@/api/portfolio'

describe('Contratos de API — flags string e formato de relatório', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toggle2FA("false") envia enabled string sem coerção', () => {
    authAPI.toggle2FA('false')

    expect(client.put).toHaveBeenCalledWith('/auth/security/2fa', { enabled: 'false' })
  })

  it('getConsolidatedReport("PDF") pede json em vez de blob', () => {
    portfolioAPI.getConsolidatedReport('PDF')

    expect(client.get).toHaveBeenCalledWith('/portfolio/report', {
      params: { format: 'PDF' },
      responseType: 'json'
    })
  })

  it('getConsolidatedReport("pdf") pede blob', () => {
    portfolioAPI.getConsolidatedReport('pdf')

    expect(client.get).toHaveBeenCalledWith('/portfolio/report', {
      params: { format: 'pdf' },
      responseType: 'blob'
    })
  })
})
