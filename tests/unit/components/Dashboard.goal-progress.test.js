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
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
  ]
})

describe('Dashboard — progresso de metas, variação e sync', () => {
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

  it('retorna 0 quando o alvo total das metas ativas é zero (evita NaN)', async () => {
    portfolioStore.goals = [
      { id: 1, status: 'active', targetAmount: 0 },
      { id: 2, status: 'active', targetAmount: 0 }
    ]
    portfolioStore.summary = { totalValue: 1500 }
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.getGoalProgress()).toBe(0)
    expect(Number.isNaN(wrapper.vm.getGoalProgress())).toBe(false)
  })

  it('formata ganho com sinal positivo e perda com sinal negativo', () => {
    const positive = wrapper.vm.formatCurrency(1500, true)
    const negative = wrapper.vm.formatCurrency(-1500, true)
    const zero = wrapper.vm.formatCurrency(0, true)

    expect(positive.replace(/\u00a0/g, ' ')).toMatch(/^\+.*1\.500/)
    expect(negative.replace(/\u00a0/g, ' ')).toMatch(/^-.*1\.500/)
    expect(zero.replace(/\u00a0/g, ' ')).toMatch(/R\$\s*0,00/)
    expect(zero.startsWith('+')).toBe(false)
  })

  it('não celebra sync quando a store devolve success false', async () => {
    portfolioStore.syncBrokers.mockResolvedValue({
      success: false,
      error: 'Falha na corretora'
    })

    await wrapper.vm.syncData()
    await flushPromises()

    expect(mockToast.success).not.toHaveBeenCalled()
    expect(mockToast.error).toHaveBeenCalledWith('Erro na sincronização dos dados')
  })
})
