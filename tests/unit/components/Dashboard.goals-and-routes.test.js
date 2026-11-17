import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}
const mockPush = vi.fn()

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

const { ok } = vi.hoisted(() => ({
  ok: { data: { success: true, data: [] } }
}))

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getSummary: vi.fn().mockResolvedValue({ data: { success: true, data: { totalValue: 0 } } }),
    getAllocation: vi.fn().mockResolvedValue(ok),
    getEvolution: vi.fn().mockResolvedValue(ok),
    getAssets: vi.fn().mockResolvedValue(ok),
    getTransactions: vi.fn().mockResolvedValue(ok),
    getGoals: vi.fn().mockResolvedValue(ok),
    getPerformance: vi.fn().mockResolvedValue(ok),
    syncBrokers: vi.fn().mockResolvedValue(ok)
  }
}))

vi.mock('@/api/analysis', () => ({
  analysisAPI: {
    getMethodologies: vi.fn().mockResolvedValue(ok),
    getRecommendations: vi.fn().mockResolvedValue(ok),
    getAlerts: vi.fn().mockResolvedValue(ok),
    getAnalysisHistory: vi.fn().mockResolvedValue(ok),
    getMarketAnalysis: vi.fn().mockResolvedValue(ok),
    getSavedAnalyses: vi.fn().mockResolvedValue(ok),
    markAlertAsRead: vi.fn().mockResolvedValue(ok)
  }
}))

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn().mockResolvedValue(ok),
    getConnectedBrokers: vi.fn().mockResolvedValue(ok),
    getSyncStatus: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getPendingConflicts: vi.fn().mockResolvedValue(ok)
  }
}))

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import Dashboard from '@/components/Dashboard.vue'

describe('Dashboard — progresso de metas, identidade e rotas', () => {
  let wrapper
  let authStore
  let portfolioStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    portfolioStore = usePortfolioStore()
    vi.clearAllMocks()

    wrapper = mount(Dashboard, {
      global: {
        stubs: { 'router-link': true }
      }
    })
    await wrapper.vm.$nextTick()
    wrapper.vm.isInitialLoading = false
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('getGoalProgress devolve 0 sem metas ativas e cap em 100% no overshoot', () => {
    portfolioStore.goals = []
    expect(wrapper.vm.getGoalProgress()).toBe(0)

    portfolioStore.summary = { totalValue: 25000, totalGain: 0, totalGainPercent: 0, totalInvested: 0 }
    portfolioStore.goals = [{ status: 'active', targetAmount: 10000 }]
    expect(wrapper.vm.getGoalProgress()).toBe(100)

    portfolioStore.goals = [{ status: 'active', targetAmount: 0 }]
    expect(wrapper.vm.getGoalProgress()).toBe(100)
  })

  it('getGoalProgress ignora metas concluídas ao somar o alvo', () => {
    portfolioStore.summary = { totalValue: 500, totalGain: 0, totalGainPercent: 0, totalInvested: 0 }
    portfolioStore.goals = [
      { status: 'completed', targetAmount: 100000 },
      { status: 'active', targetAmount: 1000 }
    ]

    expect(wrapper.vm.getGoalProgress()).toBe(50)
  })

  it('userDisplayName cai para a parte local do e-mail e depois para Usuário', () => {
    authStore.user = { email: 'ana.souza@ex.com' }
    expect(wrapper.vm.userDisplayName).toBe('ana.souza')

    authStore.user = { name: 'Ana Souza', email: 'ana@ex.com' }
    expect(wrapper.vm.userDisplayName).toBe('Ana Souza')

    authStore.user = null
    expect(wrapper.vm.userDisplayName).toBe('Usuário')
  })

  it('formatPercent trata o valor como pontos percentuais, não fração', () => {
    expect(wrapper.vm.formatPercent(15.5)).toMatch(/15[.,]50\s*%/)
    expect(wrapper.vm.formatPercent(null)).toBe('0,00%')
  })

  it('createGoal navega para /metas, rota que o router não declara', () => {
    wrapper.vm.createGoal()
    expect(mockPush).toHaveBeenCalledWith('/metas')
  })

  it('viewAllRecommendations navega para /analises', () => {
    wrapper.vm.viewAllRecommendations()
    expect(mockPush).toHaveBeenCalledWith('/analises')
  })
})
