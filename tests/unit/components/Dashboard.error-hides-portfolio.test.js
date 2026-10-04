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

describe('Dashboard — erro de análise esconde patrimônio carregado', () => {
  let wrapper
  let portfolioStore
  let analysisStore

  beforeEach(async () => {
    stubCanvas()
    setActivePinia(createPinia())
    useAuthStore().user = { name: 'Ana', email: 'ana@ex.com' }
    portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    vi.spyOn(portfolioStore, 'loadAllData').mockImplementation(async () => {
      portfolioStore.summary = {
        totalValue: 250000,
        totalGain: 12000,
        totalGainPercent: 5,
        totalInvested: 238000
      }
      portfolioStore.error = null
      return { success: true }
    })
    vi.spyOn(analysisStore, 'loadAllData').mockImplementation(async () => {
      analysisStore.error = 'falha ao carregar alertas'
      return { success: false, error: analysisStore.error }
    })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }]
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

  it('hasError fica true se só analysisStore.error está setado', () => {
    expect(portfolioStore.totalValue).toBe(250000)
    expect(portfolioStore.error).toBeNull()
    expect(analysisStore.error).toBe('falha ao carregar alertas')
    expect(wrapper.vm.hasError).toBe('falha ao carregar alertas')
  })

  it('mostra o container de erro e esconde o card de patrimônio', () => {
    expect(wrapper.find('.error-container').exists()).toBe(true)
    expect(wrapper.find('.card-main').exists()).toBe(false)
    expect(wrapper.text()).toContain('Erro ao carregar dados')
    expect(wrapper.text()).not.toContain('Patrimônio Total')
  })
})
