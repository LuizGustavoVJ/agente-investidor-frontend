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

describe('Dashboard — patrimônio negativo sem sinal', () => {
  let wrapper
  let portfolioStore

  const mountDashboard = async () => {
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
  }

  beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}))
    setActivePinia(createPinia())
    useAuthStore().user = { name: 'Ana', email: 'ana@email.com' }
    portfolioStore = usePortfolioStore()
    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(useAnalysisStore(), 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(useBrokersStore(), 'loadAllData').mockResolvedValue({ success: true })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('formatCurrency sem showSign esconde o sinal de perda', async () => {
    await mountDashboard()

    const negative = wrapper.vm.formatCurrency(-125000.5)
    const positive = wrapper.vm.formatCurrency(125000.5)

    expect(negative).toBe(positive)
    expect(negative).not.toContain('-')
  })

  it('card de patrimônio renderiza valor negativo como positivo', async () => {
    portfolioStore.summary = { totalValue: -125000.5, totalGain: -5000, totalInvested: 130000 }
    await mountDashboard()

    const cardValue = wrapper.find('.card-value').text()
    expect(cardValue).toContain('125.000,50')
    expect(cardValue).not.toContain('-')
  })
})
