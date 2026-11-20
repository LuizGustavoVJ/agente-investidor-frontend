import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getAllocation: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getEvolution: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getAssets: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getTransactions: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getGoals: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getPerformance: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    syncBrokers: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}))

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getRecommendations: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getAlerts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getAnalysisHistory: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getMarketAnalysis: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getSavedAnalyses: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    markAlertAsRead: vi.fn()
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

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({ destroy: vi.fn(), update: vi.fn() }))
}))

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Dashboard: prioridade de erro e contratos de UI', () => {
  let wrapper
  let router

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/analises', component: { template: '<div />' } },
        { path: '/metas', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } }
      ]
    })
    await router.push('/')
    wrapper = mount(Dashboard, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('errorMessage e hasError escondem erros posteriores com o primeiro truthy', () => {
    const portfolioStore = usePortfolioStore()
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()
    portfolioStore.error = 'falha portfolio'
    analysisStore.error = 'falha analysis'
    brokersStore.error = 'falha brokers'

    expect(wrapper.vm.hasError).toBe('falha portfolio')
    expect(wrapper.vm.errorMessage).toBe('falha portfolio')
  })

  it('lastUpdate ignora analysisStore.lastUpdate', () => {
    const portfolioStore = usePortfolioStore()
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()
    portfolioStore.lastUpdate = null
    brokersStore.lastSync = null
    analysisStore.lastUpdate = new Date('2026-01-01')

    expect(wrapper.vm.lastUpdate).toBeNull()
  })

  it('acceptRecommendation só mostra toast de desenvolvimento', () => {
    const analysisStore = useAnalysisStore()
    analysisStore.recommendations = [
      { id: 1, createdAt: '2026-01-01', title: 'Comprar PETR4' }
    ]

    wrapper.vm.acceptRecommendation()

    expect(toast.info).toHaveBeenCalledWith('Funcionalidade em desenvolvimento')
  })

  it('getTypeLabel deixa tipo desconhecido passar, getTypeClass cai em outros', () => {
    expect(wrapper.vm.getTypeLabel('etf')).toBe('etf')
    expect(wrapper.vm.getTypeClass('etf')).toBe('outros')
  })

  it('createGoal navega para /metas', async () => {
    const push = vi.spyOn(router, 'push')
    wrapper.vm.createGoal()
    expect(push).toHaveBeenCalledWith('/metas')
  })
})
