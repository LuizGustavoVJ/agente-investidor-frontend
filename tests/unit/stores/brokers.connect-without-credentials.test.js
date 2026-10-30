import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'
import client from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

const corretorasSource = readFileSync(
  resolve(__dirname, '../../../src/views/Corretoras.vue'),
  'utf8'
)
const apiSource = readFileSync(resolve(__dirname, '../../../src/api/brokers.js'), 'utf8')

describe('Brokers — conectar corretora sem credenciais nem accountType', () => {
  let brokersStore

  beforeEach(() => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('modal de conectar não tem senha, CPF, token nem accountType — só dispara connectBroker(broker.id)', () => {
    expect(corretorasSource).toMatch(/Conectar Nova Corretora/)
    expect(corretorasSource).toMatch(/connectBroker\(broker\.id\)/)
    expect(corretorasSource).not.toMatch(/v-model=".*credentials/)
    expect(corretorasSource).not.toMatch(/accountType/)
    expect(corretorasSource).not.toMatch(/type="password"/)
    expect(corretorasSource).not.toMatch(/\bcpf\b/i)
    expect(apiSource).toMatch(/brokerId:\s*brokerData\.brokerId/)
    expect(apiSource).toMatch(/credentials:\s*brokerData\.credentials/)
  })

  it('API connectBroker com id primitivo POST /brokers/connect sem brokerId nem credentials', () => {
    brokersAPI.connectBroker('xp-1')

    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
      brokerId: undefined,
      credentials: undefined,
      accountType: undefined
    })
  })

  it('store connectBroker("xp-1") sucesso hidrata a XP mesmo sem senha ter saído no payload', async () => {
    client.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          connectionId: 'c-xp',
          name: 'XP Investimentos',
          status: 'active',
          totalValue: 48000
        }
      }
    })

    const result = await brokersStore.connectBroker('xp-1')

    expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
      brokerId: undefined,
      credentials: undefined,
      accountType: undefined
    })
    expect(result).toEqual({
      success: true,
      data: {
        connectionId: 'c-xp',
        name: 'XP Investimentos',
        status: 'active',
        totalValue: 48000
      }
    })
    expect(brokersStore.connectedBrokers).toHaveLength(1)
    expect(brokersStore.connectedBrokers[0].name).toBe('XP Investimentos')
    expect(brokersStore.connectedBrokers[0].credentials).toBeUndefined()
    expect(brokersStore.activeBrokers).toHaveLength(1)
  })
})
