import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

vi.mock('chart.js/auto', () => {
  const Chart = vi.fn().mockImplementation(() => ({ destroy: vi.fn() }))
  return { default: Chart }
})

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn().mockResolvedValue({ data: { success: true, data: { totalValue: 10000, totalGain: 0, totalGainPercent: 0, totalInvested: 10000 } } }),
    getAllocation: vi.fn().mockResolvedValue({ data: { success: true, data: { byType: {} } } }),
    getEvolution: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getAssets: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getTransactions: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getGoals: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getPerformance: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getDividends: vi.fn(),
    getRiskAnalysis: vi.fn(),
    syncBrokers: vi.fn().mockResolvedValue({ data: { success: true } }),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn()
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
    markAlertAsRead: vi.fn(),
    runAnalysis: vi.fn(),
    getAssetAnalysis: vi.fn(),
    saveAnalysis: vi.fn(),
    deleteSavedAnalysis: vi.fn(),
    compareAssets: vi.fn(),
    getPortfolioOptimization: vi.fn()
  }
}))

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getConnectedBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getSyncStatus: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getPendingConflicts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getSyncHistory: vi.fn()
  }
}))

import Dashboard from '@/components/Dashboard.vue'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { analysisAPI } from '@/api/analysis'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/metas', component: { template: '<div />' } },
    { path: '/analises', component: { template: '<div />' } },
    { path: '/portfolio', component: { template: '<div />' } },
    { path: '/corretoras', component: { template: '<div />' } }
  ]
})

describe('Dashboard: schema de metas e feedback de alerta', () => {
  let wrapper
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': { template: '<a><slot /></a>' } }
      }
    })
    await router.isReady()
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('lê goal.name/targetAmount enquanto a store usa title/targetValue', async () => {
    const portfolio = usePortfolioStore()
    portfolio.goals = [
      { id: 1, title: 'Casa Própria', targetValue: 150000, status: 'active' }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.activeGoals[0].title).toBe('Casa Própria')
    expect(wrapper.vm.activeGoals[0].name).toBeUndefined()
    expect(wrapper.vm.activeGoals[0].targetAmount).toBeUndefined()
    expect(wrapper.text()).not.toContain('Casa Própria')
    expect(wrapper.text()).toContain('R$')
  })

  it('getGoalProgress vira NaN quando as metas só têm targetValue', () => {
    const portfolio = usePortfolioStore()
    portfolio.summary = { totalValue: 50000, totalGain: 0, totalGainPercent: 0, totalInvested: 40000 }
    portfolio.goals = [
      { id: 1, title: 'Casa', targetValue: 100000, status: 'active' }
    ]

    expect(Number.isNaN(wrapper.vm.getGoalProgress())).toBe(true)
  })

  it('formatCurrency(NaN) não cai no fallback de nulo', () => {
    const formatted = wrapper.vm.formatCurrency(NaN)
    expect(formatted).not.toBe('R$ 0,00')
    expect(formatted).toMatch(/NaN|R\$/)
  })

  it('usuário só com firstName/lastName aparece como Usuário', () => {
    const auth = useAuthStore()
    auth.user = { firstName: 'Luiz', lastName: 'Finotello', email: null }

    expect(wrapper.vm.userDisplayName).toBe('Usuário')
  })

  it('markAlertAsRead com success false não mostra toast nem erro', async () => {
    analysisAPI.markAlertAsRead.mockResolvedValue({ data: { success: false, message: 'falhou' } })

    await wrapper.vm.markAlertAsRead(1)

    expect(analysisAPI.markAlertAsRead).toHaveBeenCalledWith(1)
  })
})
