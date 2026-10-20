import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'
import { useBrokersStore } from '@/stores/brokers'
import { usePortfolioStore } from '@/stores/portfolio'
import { brokersAPI } from '@/api/brokers'
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'

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
      data: { success: true, data: { totalValue: 80000, totalGain: 0, totalGainPercent: 0, totalInvested: 80000 } }
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
    getConnectedBrokers: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 'clear', name: 'Clear', status: 'active' }]
      }
    }),
    getSyncStatus: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getPendingConflicts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getSyncHistory: vi.fn().mockResolvedValue({ data: { success: true, data: [] } })
  }
}))

describe('Dashboard — Sincronizar não recarrega corretoras', () => {
  let wrapper
  let brokersStore
  let portfolioStore

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    mockToast.info.mockClear()
    mockToast.success.mockClear()
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

    brokersStore = useBrokersStore()
    portfolioStore = usePortfolioStore()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('load inicial chama brokers; syncData não chama loadAllData nem getConnectedBrokers', async () => {
    expect(brokersAPI.getConnectedBrokers).toHaveBeenCalled()
    expect(brokersStore.connectedBrokers).toEqual([{ id: 'clear', name: 'Clear', status: 'active' }])

    brokersStore.connectedBrokers = [{ id: 'xp', name: 'XP', status: 'error', hasErrors: true }]
    brokersStore.lastSync = '2026-01-01T00:00:00.000Z'

    brokersAPI.getConnectedBrokers.mockClear()
    brokersAPI.getAvailableBrokers.mockClear()
    brokersAPI.getSyncStatus.mockClear()
    brokersAPI.getPendingConflicts.mockClear()
    portfolioAPI.syncBrokers.mockClear()
    portfolioAPI.getSummary.mockClear()
    analysisAPI.getRecommendations.mockClear()

    await wrapper.vm.syncData()
    await flushPromises()

    expect(mockToast.info).toHaveBeenCalledWith('Sincronizando dados...')
    expect(mockToast.success).toHaveBeenCalledWith('Dados sincronizados com sucesso!')
    expect(portfolioAPI.syncBrokers).toHaveBeenCalledTimes(1)
    expect(portfolioAPI.getSummary).toHaveBeenCalled()
    expect(analysisAPI.getRecommendations).toHaveBeenCalled()

    expect(brokersAPI.getConnectedBrokers).not.toHaveBeenCalled()
    expect(brokersAPI.getAvailableBrokers).not.toHaveBeenCalled()
    expect(brokersAPI.getSyncStatus).not.toHaveBeenCalled()
    expect(brokersAPI.getPendingConflicts).not.toHaveBeenCalled()
    expect(brokersStore.connectedBrokers).toEqual([{ id: 'xp', name: 'XP', status: 'error', hasErrors: true }])
    expect(brokersStore.activeBrokers).toEqual([])
    expect(brokersStore.lastSync).toBe('2026-01-01T00:00:00.000Z')
  })

  it('syncData recarrega a carteira e deixa a corretora em error fora de activeBrokers', async () => {
    brokersStore.connectedBrokers = [{ id: 'rico', name: 'Rico', status: 'error' }]
    portfolioStore.summary = { totalValue: 1, totalGain: 0, totalGainPercent: 0, totalInvested: 1 }

    await wrapper.vm.syncData()
    await flushPromises()

    expect(portfolioStore.totalValue).toBe(80000)
    expect(brokersStore.connectedBrokers[0]).toMatchObject({ id: 'rico', status: 'error' })
    expect(brokersStore.activeBrokers).toHaveLength(0)
    expect(wrapper.vm.isLoading).toBe(false)
  })
})
