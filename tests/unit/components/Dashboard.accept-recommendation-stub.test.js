import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import Dashboard from '@/components/Dashboard.vue'
import { useAnalysisStore } from '@/stores/analysis'
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
    getConnectedBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getSyncStatus: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getPendingConflicts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } })
  }
}))

const buyPetr4 = {
  id: 99,
  type: 'buy',
  asset: 'PETR4',
  priority: 'high',
  status: 'pending',
  createdAt: '2026-10-18T09:00:00.000Z'
}

describe('Dashboard — Aceitar recomendação da IA é stub e Ver mais cai em view ausente', () => {
  let wrapper
  let router
  let analysisStore
  let portfolioStore

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    mockToast.info.mockClear()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', name: 'Error404', component: { template: '<div class="not-found">404</div>' } }
      ]
    })
    await router.push('/dashboard')
    await router.isReady()

    wrapper = mount(Dashboard, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()

    analysisStore = useAnalysisStore()
    portfolioStore = usePortfolioStore()
    analysisStore.recommendations = [{ ...buyPetr4 }]
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('recomendação sem message mostra o placeholder e o botão Aceitar', () => {
    expect(wrapper.vm.currentRecommendation).toMatchObject({ id: 99, asset: 'PETR4', status: 'pending' })
    expect(wrapper.vm.currentRecommendation.message).toBeUndefined()
    expect(wrapper.text()).toContain('Analisando seu portfólio...')
    expect(wrapper.find('.btn-aceitar').exists()).toBe(true)
  })

  it('acceptRecommendation só toasta "em desenvolvimento" — status, carteira e transações ficam iguais', () => {
    const assetsBefore = portfolioStore.assets.length
    const txBefore = portfolioStore.transactions.length
    const goalsBefore = portfolioStore.goals.length
    const totalBefore = portfolioStore.totalValue

    wrapper.vm.acceptRecommendation()

    expect(mockToast.info).toHaveBeenCalledWith('Funcionalidade em desenvolvimento')
    expect(analysisStore.recommendations).toHaveLength(1)
    expect(analysisStore.recommendations[0].status).toBe('pending')
    expect(analysisStore.recommendations[0].asset).toBe('PETR4')
    expect(portfolioStore.assets).toHaveLength(assetsBefore)
    expect(portfolioStore.transactions).toHaveLength(txBefore)
    expect(portfolioStore.goals).toHaveLength(goalsBefore)
    expect(portfolioStore.totalValue).toBe(totalBefore)
    expect(mockToast.success).not.toHaveBeenCalled()
  })

  it('priority HIGH não liga o badge de alta prioridade (comparação estrita com high)', async () => {
    analysisStore.recommendations = [{ ...buyPetr4, id: 100, priority: 'HIGH' }]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentRecommendation.priority).toBe('HIGH')
    expect(wrapper.find('.alerta').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Oportunidade de Alta Prioridade')
  })

  it('Ver mais navega para /analises — view e rota real não existem', async () => {
    const routerSource = readFileSync(resolve(process.cwd(), 'src/router/index.js'), 'utf8')

    expect(existsSync(resolve(process.cwd(), 'src/views/Analises.vue'))).toBe(false)
    expect(routerSource).toContain("import('@/views/Analises.vue')")

    await wrapper.vm.viewAllRecommendations()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/analises')
    expect(router.currentRoute.value.name).toBe('Error404')
  })
})
