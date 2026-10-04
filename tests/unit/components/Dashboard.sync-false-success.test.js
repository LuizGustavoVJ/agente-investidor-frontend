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

const stubCanvas = () => {
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
}

describe('Dashboard — syncData ignora { success: false } e não toca corretoras', () => {
  let wrapper
  let portfolioStore
  let analysisStore
  let brokersStore

  beforeEach(async () => {
    stubCanvas()
    setActivePinia(createPinia())
    useAuthStore()
    portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
    brokersStore = useBrokersStore()

    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'syncAllBrokers').mockResolvedValue({ success: true })
    vi.spyOn(portfolioStore, 'syncBrokers').mockResolvedValue({ success: true })

    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.info.mockReset()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/metas', name: 'Metas', component: { template: '<div />' } }
      ]
    })
    await router.push('/dashboard')
    await router.isReady()

    wrapper = mount(Dashboard, {
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('tosta sucesso quando syncBrokers e loadAllData devolvem { success: false }', async () => {
    portfolioStore.syncBrokers.mockResolvedValue({
      success: false,
      error: 'timeout na XP'
    })
    portfolioStore.loadAllData.mockResolvedValue({
      success: false,
      error: 'resumo indisponível'
    })
    analysisStore.loadAllData.mockResolvedValue({
      success: false,
      error: 'alertas indisponíveis'
    })

    await wrapper.vm.syncData()
    await flushPromises()

    expect(portfolioStore.syncBrokers).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('Dados sincronizados com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalled()
  })

  it('não chama brokersStore.syncAllBrokers nem recarrega corretoras no sync', async () => {
    const loadCallsAfterMount = brokersStore.loadAllData.mock.calls.length

    await wrapper.vm.syncData()
    await flushPromises()

    expect(brokersStore.syncAllBrokers).not.toHaveBeenCalled()
    expect(brokersStore.loadAllData).toHaveBeenCalledTimes(loadCallsAfterMount)
  })
})
