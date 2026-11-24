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
import { brokersAPI } from '@/api/brokers'

describe('Brokers API: history/undefined e conflito sem wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: [] } })
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('getSyncHistory sem id interpola undefined no path', async () => {
    await brokersAPI.getSyncHistory(undefined)

    expect(client.get).toHaveBeenCalledWith(
      '/brokers/sync/history/undefined',
      { params: {} }
    )
  })

  it('resolveDataConflict posta o objeto de resolução cru — não { resolution }', async () => {
    const resolution = { strategy: 'keep_local', fields: ['quantity'] }

    await brokersAPI.resolveDataConflict(42, resolution)

    expect(client.post).toHaveBeenCalledWith(
      '/brokers/conflicts/42/resolve',
      resolution
    )
    expect(client.post.mock.calls[0][1]).not.toEqual({ resolution })
  })
})
