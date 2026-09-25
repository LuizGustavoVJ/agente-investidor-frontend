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

describe('Dashboard — getGoalProgress concatena targetAmount string', () => {
  let wrapper
  let portfolioStore

  beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}))
    setActivePinia(createPinia())

    const authStore = useAuthStore()
    portfolioStore = usePortfolioStore()
    authStore.user = { name: 'Ana Costa' }
    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(useAnalysisStore(), 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(useBrokersStore(), 'loadAllData').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
      ]
    })
    await router.push('/dashboard')
    await router.isReady()

    wrapper = mount(Dashboard, {
      global: { plugins: [router] }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('dois alvos string viram concatenação e o progresso fica perto de zero', async () => {
    portfolioStore.goals = [
      { id: 1, status: 'active', targetAmount: '10000' },
      { id: 2, status: 'active', targetAmount: '20000' }
    ]
    portfolioStore.summary = { totalValue: 15000 }
    await wrapper.vm.$nextTick()

    const progress = wrapper.vm.getGoalProgress()
    expect(progress).toBeCloseTo((15000 / 1000020000) * 100)
    expect(progress).toBeLessThan(1)
  })

  it('alvos numéricos somam e o progresso reflete o patrimônio', async () => {
    portfolioStore.goals = [
      { id: 1, status: 'active', targetAmount: 10000 },
      { id: 2, status: 'active', targetAmount: 20000 }
    ]
    portfolioStore.summary = { totalValue: 15000 }
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.getGoalProgress()).toBe(50)
  })
})
