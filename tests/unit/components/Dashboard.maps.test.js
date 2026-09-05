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
    { path: '/', name: 'Home', component: { template: '<div />' } },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
    { path: '/analises', name: 'Analises', component: { template: '<div />' } },
    { path: '/metas', name: 'Metas', component: { template: '<div />' } }
  ]
})

describe('Dashboard — mapas de tipo, progresso e formatação', () => {
  let wrapper
  let pinia
  let portfolioStore

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
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    authStore.user = { name: 'Ana' }
    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(portfolioStore, 'syncBrokers').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    await router.push('/dashboard')
    await mountDashboard()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('traduz tipos de ativo e usa o próprio valor como fallback', () => {
    expect(wrapper.vm.getTypeLabel('stocks')).toBe('Ações')
    expect(wrapper.vm.getTypeLabel('fiis')).toBe('FIIs')
    expect(wrapper.vm.getTypeLabel('bonds')).toBe('Renda Fixa')
    expect(wrapper.vm.getTypeLabel('funds')).toBe('Fundos')
    expect(wrapper.vm.getTypeLabel('crypto')).toBe('Criptomoedas')
    expect(wrapper.vm.getTypeLabel('others')).toBe('Outros')
    expect(wrapper.vm.getTypeLabel('etf')).toBe('etf')
  })

  it('mapeia classe CSS do tipo e cai em outros quando desconhecido', () => {
    expect(wrapper.vm.getTypeClass('stocks')).toBe('renda-variavel')
    expect(wrapper.vm.getTypeClass('fiis')).toBe('fundos-imobiliarios')
    expect(wrapper.vm.getTypeClass('bonds')).toBe('renda-fixa')
    expect(wrapper.vm.getTypeClass('crypto')).toBe('criptomoedas')
    expect(wrapper.vm.getTypeClass('desconhecido')).toBe('outros')
  })

  it('calcula progresso das metas ativas e limita a 100%', async () => {
    expect(wrapper.vm.getGoalProgress()).toBe(0)

    portfolioStore.goals = [
      { id: 1, status: 'active', targetAmount: 10000 },
      { id: 2, status: 'completed', targetAmount: 50000 }
    ]
    portfolioStore.summary = { totalValue: 4000 }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.getGoalProgress()).toBe(40)

    portfolioStore.summary = { totalValue: 50000 }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.getGoalProgress()).toBe(100)
  })

  it('formata número nulo como zero e data vazia como string vazia', () => {
    expect(wrapper.vm.formatNumber(null)).toBe('0')
    expect(wrapper.vm.formatNumber(undefined)).toBe('0')
    expect(wrapper.vm.formatDate(null)).toBe('')
    expect(wrapper.vm.formatDate('2026-09-05T10:00:00.000Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('só tenta aceitar recomendação quando existe uma atual', async () => {
    mockToast.info.mockClear()
    wrapper.vm.acceptRecommendation()
    expect(mockToast.info).not.toHaveBeenCalled()
  })
})
