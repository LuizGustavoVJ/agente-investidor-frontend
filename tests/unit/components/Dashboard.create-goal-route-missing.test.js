import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'

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
      data: { success: true, data: { totalValue: 0, totalGain: 0, totalGainPercent: 0, totalInvested: 0 } }
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

describe('Dashboard — CTA de meta aponta para rota inexistente', () => {
  let wrapper
  let router

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/analises', name: 'Analises', component: { template: '<div />' } },
        {
          path: '/:pathMatch(.*)*',
          name: 'Error404',
          component: { template: '<div class="not-found">404</div>' }
        }
      ]
    })
    await router.push('/dashboard')
    await router.isReady()

    wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router]
      }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('o roteador de teste (espelhando master) não registra /metas', () => {
    const metas = router.getRoutes().find((r) => r.path === '/metas' || r.name === 'Metas')
    expect(metas).toBeUndefined()
  })

  it('createGoal navega para /metas e cai no catch-all 404', async () => {
    await wrapper.vm.createGoal()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/metas')
    expect(router.currentRoute.value.name).toBe('Error404')
  })

  it('sem metas, o botão "Criar primeira meta" chama createGoal e 404', async () => {
    const button = wrapper.find('.create-goal-btn')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('Error404')
    expect(router.currentRoute.value.path).toBe('/metas')
  })
})
