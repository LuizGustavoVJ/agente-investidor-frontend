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

describe('API: mutações financeiras encaminham o body cru', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true, data: {} } })
  })

  it('applyRebalance e addTransaction postam o payload inteiro, inclusive campos extras', async () => {
    const rebalance = { allocations: [{ symbol: 'PETR4', weight: 1 }], userId: 'injected', dryRun: false }
    const transaction = { symbol: 'VALE3', quantity: -999, type: 'sell', password: 'secret' }

    await portfolioAPI.applyRebalance(rebalance)
    await portfolioAPI.addTransaction(transaction)

    expect(client.post).toHaveBeenCalledWith('/portfolio/rebalance', rebalance)
    expect(client.post).toHaveBeenCalledWith('/portfolio/transactions', transaction)
  })

  it('exportToBroker e mapAssets também encaminham o objeto cru', async () => {
    const exportPayload = { positions: true, credentials: { token: 'plain' } }
    const mapping = { from: 'PETR4', to: 'PETR3', overwrite: true }

    await brokersAPI.exportToBroker('xp-1', exportPayload)
    await brokersAPI.mapAssets(mapping)

    expect(client.post).toHaveBeenCalledWith('/brokers/export/xp-1', exportPayload)
    expect(client.post).toHaveBeenCalledWith('/brokers/assets/map', mapping)
  })
})
