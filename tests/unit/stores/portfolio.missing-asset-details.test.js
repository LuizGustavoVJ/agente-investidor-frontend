import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'
import { portfolioAPI } from '@/api/portfolio'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn(),
    getAllocation: vi.fn(),
    getEvolution: vi.fn(),
    getAssets: vi.fn(),
    getTransactions: vi.fn(),
    getGoals: vi.fn(),
    getPerformance: vi.fn(),
    getAssetDetails: vi.fn()
  }
}))

const dashboardSource = readFileSync(
  resolve(__dirname, '../../../src/components/Dashboard.vue'),
  'utf8'
)
const storeSource = readFileSync(
  resolve(__dirname, '../../../src/stores/portfolio.js'),
  'utf8'
)

describe('Portfolio — getAssetDetails existe na API e o Dashboard não abre o ativo', () => {
  let portfolioStore

  beforeEach(() => {
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
    vi.clearAllMocks()
    portfolioStore.assets = [
      {
        symbol: 'PETR4',
        name: 'Petrobras',
        currentValue: 42000,
        currentPrice: 38.1,
        quantity: 1100,
        variation: 1.4
      }
    ]
  })

  it('store não expõe getAssetDetails/fetchAssetDetails — PETR4 local não muda', () => {
    expect(typeof portfolioAPI.getAssetDetails).toBe('function')
    expect(storeSource).not.toMatch(/getAssetDetails/)
    expect(portfolioStore.getAssetDetails).toBeUndefined()
    expect(portfolioStore.fetchAssetDetails).toBeUndefined()
    expect(portfolioStore.topAssets[0].symbol).toBe('PETR4')
    expect(portfolioStore.assets[0].currentValue).toBe(42000)
  })

  it('Dashboard lista o símbolo sem @click e não chama detalhes do ativo', () => {
    expect(dashboardSource).toMatch(/v-for="asset in topAssets/)
    expect(dashboardSource).toMatch(/asset\.symbol/)
    expect(dashboardSource).not.toMatch(/getAssetDetails|fetchAssetDetails/)
    expect(dashboardSource).not.toMatch(/<tr[^>]*@click/)
    expect(portfolioAPI.getAssetDetails).not.toHaveBeenCalled()
  })
})
