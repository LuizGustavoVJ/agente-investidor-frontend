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
import { analysisAPI } from '@/api/analysis'
import { brokersAPI } from '@/api/brokers'

describe('IDs com ? / # / espaço — interpolação sem encode altera a URL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
  })

  it('getAssetDetails("PETR4?raw=1") coloca query na URL em vez de tratar o símbolo como um segmento', async () => {
    await portfolioAPI.getAssetDetails('PETR4?raw=1')

    expect(client.get).toHaveBeenCalledWith('/portfolio/assets/PETR4?raw=1')
    const url = client.get.mock.calls[0][0]
    expect(url).toContain('?raw=1')
    expect(url).not.toContain(encodeURIComponent('PETR4?raw=1'))
  })

  it('deleteTransaction com id "10?force=true" muda o recurso para query string', async () => {
    await portfolioAPI.deleteTransaction('10?force=true')

    expect(client.delete).toHaveBeenCalledWith('/portfolio/transactions/10?force=true')
  })

  it('getSharedAnalysis com token "abc#frag" deixa o fragmento na URL', async () => {
    await analysisAPI.getSharedAnalysis('abc#frag')

    expect(client.get).toHaveBeenCalledWith('/analysis/shared/abc#frag')
  })

  it('disconnectBroker com id "xp extra" interpola espaço cru no path', async () => {
    await brokersAPI.disconnectBroker('xp extra')

    expect(client.delete).toHaveBeenCalledWith('/brokers/disconnect/xp extra')
  })
})
