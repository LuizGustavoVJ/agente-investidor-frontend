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

describe('Brokers API — getSyncStatus com id falsy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: { success: true, data: {} } })
  })

  it('getSyncStatus(0) usa a URL de lista (0 é falsy)', async () => {
    await brokersAPI.getSyncStatus(0)

    expect(client.get).toHaveBeenCalledWith('/brokers/sync/status')
    expect(client.get).not.toHaveBeenCalledWith('/brokers/sync/status/0')
  })

  it('getSyncStatus("") também cai na URL de lista', async () => {
    await brokersAPI.getSyncStatus('')

    expect(client.get).toHaveBeenCalledWith('/brokers/sync/status')
  })

  it('getSyncStatus("0") consulta a conexão 0', async () => {
    await brokersAPI.getSyncStatus('0')

    expect(client.get).toHaveBeenCalledWith('/brokers/sync/status/0')
  })
})
