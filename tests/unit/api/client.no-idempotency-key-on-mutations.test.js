import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authAPI } from '@/api/auth'
import { portfolioAPI } from '@/api/portfolio'
import { brokersAPI } from '@/api/brokers'
import client from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const authApiSource = readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8')
const portfolioApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/portfolio.js'),
  'utf8'
)
const brokersApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/brokers.js'),
  'utf8'
)

describe('HTTP client — POST de mutação sem Idempotency-Key', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('axios.create e o interceptor não definem Idempotency-Key nem X-Idempotency-Key', () => {
    expect(clientSource).toMatch(/axios\.create\(/)
    expect(clientSource).not.toMatch(/Idempotency-Key|X-Idempotency-Key|idempotencyKey/)
    expect(clientSource).not.toMatch(/crypto\.randomUUID|uuid|nanoid/)
  })

  it('login, sync de carteira/corretoras e connect saem sem chave — retry após timeout 30s pode duplicar', async () => {
    const loginFn = authApiSource.slice(
      authApiSource.indexOf('login:'),
      authApiSource.indexOf('register:')
    )
    expect(loginFn).toMatch(/client\.post\('\/auth\/login'/)
    expect(loginFn).not.toMatch(/Idempotency|headers/)

    const syncFn = portfolioApiSource.slice(
      portfolioApiSource.indexOf('syncBrokers:'),
      portfolioApiSource.indexOf('getSyncStatus:')
    )
    expect(syncFn).toMatch(/client\.post\('\/portfolio\/sync'\)/)
    expect(syncFn).not.toMatch(/Idempotency|headers/)

    const syncAllFn = brokersApiSource.slice(
      brokersApiSource.indexOf('syncAllBrokers:'),
      brokersApiSource.indexOf('getSyncStatus:')
    )
    expect(syncAllFn).toMatch(/client\.post\('\/brokers\/sync\/all'\)/)
    expect(syncAllFn).not.toMatch(/Idempotency|headers/)

    const connectFn = brokersApiSource.slice(
      brokersApiSource.indexOf('connectBroker:'),
      brokersApiSource.indexOf('disconnectBroker:')
    )
    expect(connectFn).toMatch(/client\.post\('\/brokers\/connect'/)
    expect(connectFn).not.toMatch(/Idempotency|headers/)

    await authAPI.login({ email: 'ana@exemplo.com', password: 'Segredo1!' })
    await portfolioAPI.syncBrokers()
    await brokersAPI.syncAllBrokers()
    await brokersAPI.connectBroker({
      brokerId: 'xp',
      credentials: { user: 'ana', password: 'x' },
      accountType: 'conta-corrente'
    })

    expect(client.post).toHaveBeenCalledTimes(4)

    for (const call of client.post.mock.calls) {
      const config = call[2]
      expect(config?.headers?.['Idempotency-Key']).toBeUndefined()
      expect(config?.headers?.['X-Idempotency-Key']).toBeUndefined()
    }

    expect(client.post.mock.calls[0][0]).toBe('/auth/login')
    expect(client.post.mock.calls[1][0]).toBe('/portfolio/sync')
    expect(client.post.mock.calls[2][0]).toBe('/brokers/sync/all')
    expect(client.post.mock.calls[3][0]).toBe('/brokers/connect')
  })
})
