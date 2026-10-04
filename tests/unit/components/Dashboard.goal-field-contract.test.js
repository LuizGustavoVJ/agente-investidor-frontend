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

describe('Dashboard — contrato name/targetAmount vs title/targetValue das Metas', () => {
  let wrapper
  let portfolioStore

  beforeEach(async () => {
    stubCanvas()
    setActivePinia(createPinia())
    useAuthStore()
    portfolioStore = usePortfolioStore()
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

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

  it('meta no shape da view (title/targetValue) some do rótulo e do valor', async () => {
    portfolioStore.summary = { totalValue: 45000 }
    portfolioStore.goals = [
      {
        id: 1,
        title: 'Casa Própria',
        targetValue: 150000,
        currentValue: 45000,
        status: 'active'
      }
    ]
    await flushPromises()

    const item = wrapper.find('.meta-item')
    expect(item.exists()).toBe(true)
    expect(item.text()).not.toContain('Casa Própria')
    expect(item.find('.meta-valor').text()).toBe('R$ 0,00')
  })

  it('getGoalProgress vira NaN quando o alvo vem como targetValue', () => {
    portfolioStore.summary = { totalValue: 45000 }
    portfolioStore.goals = [
      {
        id: 1,
        title: 'Casa Própria',
        targetValue: 150000,
        status: 'active'
      }
    ]

    expect(wrapper.vm.getGoalProgress()).toBeNaN()
  })

  it('meta com name/targetAmount aparece com valor e entra no progresso', async () => {
    portfolioStore.summary = { totalValue: 50000 }
    portfolioStore.goals = [
      {
        id: 2,
        name: 'Reserva',
        targetAmount: 100000,
        status: 'active'
      }
    ]
    await flushPromises()

    expect(wrapper.find('.meta-item').text()).toContain('Reserva')
    expect(wrapper.find('.meta-valor').text()).toMatch(/100\.000/)
    expect(wrapper.vm.getGoalProgress()).toBe(50)
  })
})
