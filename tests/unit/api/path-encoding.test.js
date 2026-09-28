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
import { brokersAPI } from '@/api/brokers'
import { analysisAPI } from '@/api/analysis'

describe('Contratos de API — IDs e símbolos interpolados sem encodeURIComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
  })

  it('getAssetDetails("PETR4/SA") quebra o path em um segmento extra', async () => {
    await portfolioAPI.getAssetDetails('PETR4/SA')

    expect(client.get).toHaveBeenCalledWith('/portfolio/assets/PETR4/SA')
    expect(client.get.mock.calls[0][0]).not.toBe(
      `/portfolio/assets/${encodeURIComponent('PETR4/SA')}`
    )
  })

  it('deleteTransaction com id contendo barra aponta para outra rota', async () => {
    await portfolioAPI.deleteTransaction('tx/123')

    expect(client.delete).toHaveBeenCalledWith('/portfolio/transactions/tx/123')
  })

  it('disconnectBroker com connectionId "xp/1" não percent-encode', async () => {
    await brokersAPI.disconnectBroker('xp/1')

    expect(client.delete).toHaveBeenCalledWith('/brokers/disconnect/xp/1')
  })

  it('getSharedAnalysis com token contendo barra muda o recurso pedido', async () => {
    await analysisAPI.getSharedAnalysis('abc/def')

    expect(client.get).toHaveBeenCalledWith('/analysis/shared/abc/def')
  })
})
