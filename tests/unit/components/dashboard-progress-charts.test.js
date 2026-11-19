import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'
import { useAuthStore } from '@/stores/auth'
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'
import { brokersAPI } from '@/api/brokers'

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

const ok = (data = {}) => Promise.resolve({ data: { success: true, data } })

function stubApis() {
  vi.spyOn(portfolioAPI, 'getSummary').mockResolvedValue(ok({}))
  vi.spyOn(portfolioAPI, 'getAllocation').mockResolvedValue(ok({}))
  vi.spyOn(portfolioAPI, 'getEvolution').mockResolvedValue(ok(null))
  vi.spyOn(portfolioAPI, 'getAssets').mockResolvedValue(ok([]))
  vi.spyOn(portfolioAPI, 'getTransactions').mockResolvedValue(ok([]))
  vi.spyOn(portfolioAPI, 'getGoals').mockResolvedValue(ok([]))
  vi.spyOn(portfolioAPI, 'getPerformance').mockResolvedValue(ok({}))
  vi.spyOn(portfolioAPI, 'getRiskAnalysis').mockResolvedValue(ok({}))
  vi.spyOn(portfolioAPI, 'syncBrokers').mockResolvedValue(ok({}))
  vi.spyOn(analysisAPI, 'getMethodologies').mockResolvedValue(ok([]))
  vi.spyOn(analysisAPI, 'getRecommendations').mockResolvedValue(ok([]))
  vi.spyOn(analysisAPI, 'getAlerts').mockResolvedValue(ok([]))
  vi.spyOn(analysisAPI, 'getAnalysisHistory').mockResolvedValue(ok([]))
  vi.spyOn(analysisAPI, 'getMarketAnalysis').mockResolvedValue(ok({}))
  vi.spyOn(analysisAPI, 'getSavedAnalyses').mockResolvedValue(ok([]))
  vi.spyOn(brokersAPI, 'getAvailableBrokers').mockResolvedValue(ok([]))
  vi.spyOn(brokersAPI, 'getConnectedBrokers').mockResolvedValue(ok([]))
  vi.spyOn(brokersAPI, 'getSyncStatus').mockResolvedValue(ok({}))
  vi.spyOn(brokersAPI, 'getPendingConflicts').mockResolvedValue(ok([]))
}

describe('Dashboard — progresso, NaN e gráfico de evolução', () => {
  let router
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    stubApis()
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      canvas: {},
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
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
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/dashboard', component: { template: '<div />' } },
        { path: '/metas', component: { template: '<div />' } },
        { path: '/analises', component: { template: '<div />' } }
      ]
    })
    await router.push('/dashboard')
    await router.isReady()
    mockToast.success.mockClear()
    mockToast.info.mockClear()
    mockToast.error.mockClear()
  })

  const mountDash = async () => {
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    await flushPromises()
    return wrapper
  }

  it('getGoalProgress compara patrimônio total com soma das metas — 100% com meta pequena', async () => {
    const wrapper = await mountDash()
    const portfolio = usePortfolioStore()
    portfolio.summary = { totalValue: 500000 }
    portfolio.goals = [{ id: 1, status: 'active', targetAmount: 10000, name: 'Reserva' }]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.getGoalProgress()).toBe(100)
    wrapper.unmount()
  })

  it('getGoalProgress com targetAmount 0 devolve 100 (Infinity capado), não 0', async () => {
    const wrapper = await mountDash()
    const portfolio = usePortfolioStore()
    portfolio.summary = { totalValue: 1000 }
    portfolio.goals = [{ id: 1, status: 'active', targetAmount: 0 }]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.getGoalProgress()).toBe(100)
    wrapper.unmount()
  })

  it('formatPercent divide por 100 — 15.5 vira 15,50%; 0.155 vira 0,16%', async () => {
    const wrapper = await mountDash()
    expect(wrapper.vm.formatPercent(15.5)).toMatch(/15[,.]50\s*%/)
    expect(wrapper.vm.formatPercent(0.155)).toMatch(/0[,.]1[56]\s*%/)
    expect(wrapper.vm.formatPercent(null)).toBe('0,00%')
    wrapper.unmount()
  })

  it('formatCurrency(NaN) não cai no fallback de nulo', async () => {
    const wrapper = await mountDash()
    const formatted = wrapper.vm.formatCurrency(NaN)
    expect(formatted).not.toBe('R$ 0,00')
    expect(formatted).toMatch(/NaN|R\$/)
    wrapper.unmount()
  })

  it('formatDate de string inválida lança RangeError (date-fns)', async () => {
    const wrapper = await mountDash()
    expect(() => wrapper.vm.formatDate('não-é-data')).toThrow()
    wrapper.unmount()
  })

  it('totalGainPercent com NaN cai no || 0 e gainClass fica neutro', async () => {
    const wrapper = await mountDash()
    const portfolio = usePortfolioStore()
    portfolio.summary = { totalGainPercent: Number.NaN }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.totalGainPercent).toBe(0)
    expect(wrapper.vm.gainClass.neutro).toBe(true)
    wrapper.unmount()
  })

  it('createEvolutionChart quebra se evolution é objeto (não array)', async () => {
    const wrapper = await mountDash()
    const portfolio = usePortfolioStore()
    portfolio.evolution = { data: [{ date: '2024-01-01', value: 1 }] }
    wrapper.vm.evolutionChart = { getContext: () => ({}) }

    expect(() => wrapper.vm.createEvolutionChart()).toThrow()
    wrapper.unmount()
  })

  it('createAllocationChart lê value.percentage — número cru vira undefined no dataset', async () => {
    const Chart = (await import('chart.js/auto')).default
    Chart.mockClear()
    const wrapper = await mountDash()
    const portfolio = usePortfolioStore()
    portfolio.allocation = { byType: { stocks: 40, fiis: 60 } }
    wrapper.vm.allocationChart = { getContext: () => ({}) }

    wrapper.vm.createAllocationChart()
    const cfg = Chart.mock.calls.at(-1)?.[1]
    expect(cfg.data.datasets[0].data).toEqual([undefined, undefined])
    wrapper.unmount()
  })

  it('createGoal navega para /metas, rota ausente no router de produção', async () => {
    const wrapper = await mountDash()
    const pushSpy = vi.spyOn(router, 'push')
    wrapper.vm.createGoal()
    expect(pushSpy).toHaveBeenCalledWith('/metas')
    wrapper.unmount()
  })

  it('syncData toasta sucesso mesmo quando as stores devolvem success:false', async () => {
    const wrapper = await mountDash()
    const portfolio = usePortfolioStore()
    const analysis = useAnalysisStore()
    vi.spyOn(portfolio, 'syncBrokers').mockResolvedValue({ success: false })
    vi.spyOn(portfolio, 'loadAllData').mockResolvedValue({ success: false })
    vi.spyOn(analysis, 'loadAllData').mockResolvedValue({ success: false })

    await wrapper.vm.syncData()
    expect(mockToast.success).toHaveBeenCalledWith('Dados sincronizados com sucesso!')
    wrapper.unmount()
  })

  it('userDisplayName cai no local-part do email e depois em Usuário', async () => {
    const wrapper = await mountDash()
    const auth = useAuthStore()
    auth.user = { email: 'ana@ex.com' }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.userDisplayName).toBe('ana')

    auth.user = {}
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.userDisplayName).toBe('Usuário')
    wrapper.unmount()
  })
})
