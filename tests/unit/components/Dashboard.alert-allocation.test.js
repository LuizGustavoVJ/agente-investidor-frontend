import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
    { path: '/analises', name: 'Analises', component: { template: '<div />' } },
    { path: '/metas', name: 'Metas', component: { template: '<div />' } }
  ]
})

describe('Dashboard — alerta silencioso, alocação e recomendação', () => {
  let wrapper
  let pinia
  let portfolioStore
  let analysisStore

  const mountDashboard = async () => {
    wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router]
      }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  }

  beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}))
    pinia = createPinia()
    setActivePinia(pinia)

    const authStore = useAuthStore()
    portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    authStore.user = { name: 'Ana' }
    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(portfolioStore, 'syncBrokers').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    await router.push('/dashboard')
    await mountDashboard()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    mockToast.info.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('markAlertAsRead com success false não mostra toast de sucesso nem de erro', async () => {
    vi.spyOn(analysisStore, 'markAlertAsRead').mockResolvedValue({
      success: false,
      error: 'Alerta expirado'
    })

    await wrapper.vm.markAlertAsRead(7)

    expect(analysisStore.markAlertAsRead).toHaveBeenCalledWith(7)
    expect(mockToast.success).not.toHaveBeenCalled()
    expect(mockToast.error).not.toHaveBeenCalled()
  })

  it('formatPercent de percentage ausente na alocação vira 0,00% em vez de quebrar', () => {
    portfolioStore.allocation = { byType: { stocks: 45, fiis: 20 } }

    const stocks = wrapper.vm.assetsByType.stocks
    expect(stocks).toBe(45)
    expect(wrapper.vm.formatPercent(stocks?.percentage).replace(/\u00a0/g, ' ')).toMatch(/0,00%/)
  })

  it('acceptRecommendation só mostra toast stub e não chama a store', () => {
    analysisStore.recommendations = [
      { id: 1, createdAt: new Date().toISOString(), title: 'Comprar PETR4' }
    ]

    wrapper.vm.acceptRecommendation()

    expect(mockToast.info).toHaveBeenCalledWith('Funcionalidade em desenvolvimento')
    expect(analysisStore.recommendations[0]).toMatchObject({ id: 1 })
  })
})
