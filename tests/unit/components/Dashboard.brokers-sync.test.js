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
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
  ]
})

describe('Dashboard — sync não cobre corretoras', () => {
  let wrapper
  let pinia
  let portfolioStore
  let analysisStore
  let brokersStore

  beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: [] })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => []),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn()
    }))

    pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore()
    portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
    brokersStore = useBrokersStore()

    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(portfolioStore, 'syncBrokers').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'syncAllBrokers').mockResolvedValue({ success: true })

    wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router],
        stubs: {
          'router-link': true
        }
      }
    })
    await flushPromises()
    mockToast.success.mockClear()
    mockToast.info.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('sincroniza portfolio e análises, mas não dispara sync das corretoras', async () => {
    const loadCallsAfterMount = brokersStore.loadAllData.mock.calls.length

    await wrapper.vm.syncData()
    await flushPromises()

    expect(portfolioStore.syncBrokers).toHaveBeenCalledTimes(1)
    expect(portfolioStore.loadAllData).toHaveBeenCalled()
    expect(analysisStore.loadAllData).toHaveBeenCalled()
    expect(brokersStore.syncAllBrokers).not.toHaveBeenCalled()
    expect(brokersStore.loadAllData).toHaveBeenCalledTimes(loadCallsAfterMount)
    expect(mockToast.success).toHaveBeenCalledWith('Dados sincronizados com sucesso!')
  })

  it('celebra o sync mesmo se as stores devolvem success false sem lançar', async () => {
    portfolioStore.syncBrokers.mockResolvedValue({ success: false, error: 'XP offline' })
    portfolioStore.loadAllData.mockResolvedValue({ success: false, error: 'timeout' })

    await wrapper.vm.syncData()
    await flushPromises()

    expect(mockToast.success).toHaveBeenCalledWith('Dados sincronizados com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalled()
  })
})
