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

describe('brokersAPI.connectBroker — id primitivo vs objeto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true, data: {} } })
  })

  it('Corretoras chama connectBroker(broker.id); número não tem .brokerId e o POST sai vazio', async () => {
    await brokersAPI.connectBroker(3)

    expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
      brokerId: undefined,
      credentials: undefined,
      accountType: undefined
    })
  })

  it('id string ("xp") também envia brokerId undefined — a corretora nunca é identificada', async () => {
    await brokersAPI.connectBroker('xp')

    expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
      brokerId: undefined,
      credentials: undefined,
      accountType: undefined
    })
  })

  it('objeto com brokerId é o único formato que o backend recebe', async () => {
    await brokersAPI.connectBroker({
      brokerId: 'xp',
      credentials: { apiKey: 'k' },
      accountType: 'conta-corrente'
    })

    expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
      brokerId: 'xp',
      credentials: { apiKey: 'k' },
      accountType: 'conta-corrente'
    })
  })
})
