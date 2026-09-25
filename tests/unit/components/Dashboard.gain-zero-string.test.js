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

describe('Dashboard — variação "0" (string) não aplica classe neutro', () => {
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

  it('totalGainPercent "0" é truthy na store e não marca positivo/negativo/neutro', async () => {
    portfolioStore.summary = {
      totalValue: 10000,
      totalGain: 0,
      totalGainPercent: '0',
      totalInvested: 10000
    }
    await wrapper.vm.$nextTick()

    expect(portfolioStore.totalGainPercent).toBe('0')
    expect(wrapper.vm.gainClass).toEqual({
      positivo: false,
      negativo: false,
      neutro: false
    })
  })

  it('totalGainPercent numérico 0 aplica a classe neutro', async () => {
    portfolioStore.summary = {
      totalValue: 10000,
      totalGain: 0,
      totalGainPercent: 0,
      totalInvested: 10000
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.gainClass).toEqual({
      positivo: false,
      negativo: false,
      neutro: true
    })
  })
})
