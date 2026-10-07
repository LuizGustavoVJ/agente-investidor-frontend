import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
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

describe('Dashboard — progresso de metas usa patrimônio total, não o acumulado da meta', () => {
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

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/dashboard', component: { template: '<div />' } },
        { path: '/analises', component: { template: '<div />' } }
      ]
    })
    await router.push('/dashboard')
    await router.isReady()

    wrapper = mount(Dashboard, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })

    await flushPromises()
  })

  it('patrimônio 500k contra meta de 10k com 0 acumulado aparece como 100%', () => {
    portfolioStore.goals = [
      { id: 1, name: 'Reserva', status: 'active', targetAmount: 10000, currentAmount: 0 }
    ]
    portfolioStore.summary = { totalValue: 500000 }

    expect(wrapper.vm.getGoalProgress()).toBe(100)
  })

  it('duas metas ativas somam os alvos e comparam com o patrimônio inteiro', () => {
    portfolioStore.goals = [
      { id: 1, name: 'Casa', status: 'active', targetAmount: 80000, currentAmount: 1000 },
      { id: 2, name: 'Carro', status: 'active', targetAmount: 20000, currentAmount: 500 }
    ]
    portfolioStore.summary = { totalValue: 50000 }

    expect(wrapper.vm.getGoalProgress()).toBe(50)
  })
})
