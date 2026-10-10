import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'
import { usePortfolioStore } from '@/stores/portfolio'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: { totalValue: 50000, totalGain: 0, totalGainPercent: 0, totalInvested: 50000 }
      }
    }),
    getAllocation: vi.fn().mockResolvedValue({ data: { success: true, data: { byType: {} } } }),
    getEvolution: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getAssets: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getTransactions: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getGoals: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getPerformance: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
    getRiskAnalysis: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
    syncBrokers: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}))

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getRecommendations: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getAlerts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getAnalysisHistory: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getMarketAnalysis: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
    getSavedAnalyses: vi.fn().mockResolvedValue({ data: { success: true, data: [] } })
  }
}))

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getConnectedBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getSyncStatus: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getPendingConflicts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } })
  }
}))

describe('Dashboard — getGoalProgress com alvo zero ou ausente', () => {
  let wrapper
  let portfolioStore

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    portfolioStore = usePortfolioStore()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }]
    })
    await router.push('/dashboard')
    await router.isReady()

    wrapper = mount(Dashboard, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('alvo 0 com patrimônio 50k vira 100% (Infinity limitado por Math.min)', async () => {
    portfolioStore.summary = {
      totalValue: 50000,
      totalGain: 0,
      totalGainPercent: 0,
      totalInvested: 50000
    }
    portfolioStore.goals = [
      { id: 1, name: 'Reserva sem alvo', status: 'active', targetAmount: 0 }
    ]
    await wrapper.vm.$nextTick()

    const progress = wrapper.vm.getGoalProgress()
    expect(Number.isFinite(progress)).toBe(true)
    expect(progress).toBe(100)
  })

  it('targetAmount ausente (contrato targetValue) devolve NaN na barra', async () => {
    portfolioStore.summary = {
      totalValue: 50000,
      totalGain: 0,
      totalGainPercent: 0,
      totalInvested: 50000
    }
    portfolioStore.goals = [
      { id: 2, title: 'Casa', status: 'active', targetValue: 150000, currentValue: 45000 }
    ]
    await wrapper.vm.$nextTick()

    const progress = wrapper.vm.getGoalProgress()
    expect(Number.isNaN(progress)).toBe(true)
  })
})
