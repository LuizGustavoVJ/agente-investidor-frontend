import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({ destroy: vi.fn() }))
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

import Dashboard from '@/components/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/dashboard', component: { template: '<div />' } },
    { path: '/metas', component: { template: '<div />' } }
  ]
})

describe('Dashboard — progresso de meta e formatação', () => {
  let wrapper
  let portfolioStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    portfolioStore.loadAllData = vi.fn().mockResolvedValue({ success: true })
    analysisStore.loadAllData = vi.fn().mockResolvedValue({ success: true })
    brokersStore.loadAllData = vi.fn().mockResolvedValue({ success: true })

    wrapper = mount(Dashboard, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })

    await router.isReady()
    await flushPromises()
  })

  it('alvo total 0 com patrimônio positivo devolve 100, não 0', async () => {
    portfolioStore.goals = [
      { id: 1, name: 'Meta zerada', status: 'active', targetAmount: 0 }
    ]
    portfolioStore.summary = { totalValue: 25000 }

    expect(wrapper.vm.getGoalProgress()).toBe(100)
  })

  it('meta sem targetAmount gera progresso NaN', async () => {
    portfolioStore.goals = [
      { id: 2, name: 'Sem alvo', status: 'active' }
    ]
    portfolioStore.summary = { totalValue: 10000 }

    expect(Number.isNaN(wrapper.vm.getGoalProgress())).toBe(true)
  })

  it('formatCurrency e formatPercent vazam NaN (só nulo/undefined têm fallback)', () => {
    expect(wrapper.vm.formatCurrency(NaN)).toMatch(/NaN/)
    expect(wrapper.vm.formatPercent(NaN)).toMatch(/NaN/)
  })
})
