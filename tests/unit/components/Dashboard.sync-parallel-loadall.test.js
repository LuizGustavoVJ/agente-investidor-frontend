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

describe('Dashboard — syncData dispara loadAllData sem esperar o pós-sync', () => {
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
    vi.spyOn(portfolioStore, 'syncBrokers').mockResolvedValue({ success: true })

    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.info.mockReset()

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
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('começa loadAllData enquanto syncBrokers ainda não resolveu', async () => {
    let finishSync
    portfolioStore.syncBrokers.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSync = () => resolve({ success: true })
        })
    )

    let loadStartedWhileSyncPending = false
    portfolioStore.loadAllData.mockImplementation(async () => {
      loadStartedWhileSyncPending = finishSync !== undefined && true
      return { success: true }
    })

    const pending = wrapper.vm.syncData()
    await flushPromises()

    expect(finishSync).toBeTypeOf('function')
    expect(loadStartedWhileSyncPending).toBe(true)
    expect(analysisStore.loadAllData).toHaveBeenCalled()

    finishSync()
    await pending
    await flushPromises()
  })
})
