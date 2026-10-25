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

vi.mock('@/api/auth', () => ({
  authAPI: {
    logout: vi.fn(),
    checkAuth: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn().mockResolvedValue({
      data: { success: true, data: { totalValue: 100000, totalGain: 0, totalGainPercent: 0, totalInvested: 100000 } }
    }),
    getAllocation: vi.fn().mockResolvedValue({
      data: { success: true, data: { byType: { stocks: 60, fiis: 40 } } }
    }),
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
    getPendingConflicts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getSyncHistory: vi.fn().mockResolvedValue({ data: { success: true, data: [] } })
  }
}))

describe('Dashboard — alocação byType como número (sem .percentage)', () => {
  let wrapper

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      canvas: { width: 0, height: 0 },
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: [] })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => []),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn()
    }))

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

  it('byType { stocks: 60, fiis: 40 } mostra 0,00% — lê value.percentage de um número', async () => {
    const portfolioStore = usePortfolioStore()
    expect(portfolioStore.assetsByType).toEqual({ stocks: 60, fiis: 40 })

    expect(wrapper.vm.formatPercent(portfolioStore.assetsByType.stocks.percentage)).toBe('0,00%')
    expect(wrapper.vm.formatPercent(60)).not.toBe('0,00%')

    const percents = wrapper.findAll('.percent').map((n) => n.text())
    expect(percents.length).toBeGreaterThan(0)
    expect(percents.every((text) => text === '0,00%')).toBe(true)
    expect(wrapper.text()).not.toMatch(/60/)
  })
})
