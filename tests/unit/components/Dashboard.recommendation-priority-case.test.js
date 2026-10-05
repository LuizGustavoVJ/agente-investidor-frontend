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

const mountDashboard = async () => {
  stubCanvas()
  setActivePinia(createPinia())
  useAuthStore()
  const portfolioStore = usePortfolioStore()
  const analysisStore = useAnalysisStore()
  const brokersStore = useBrokersStore()

  vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
  vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
  vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
    ]
  })
  await router.push('/dashboard')
  await router.isReady()

  const wrapper = mount(Dashboard, {
    global: { plugins: [router] }
  })
  await flushPromises()
  return { wrapper, analysisStore }
}

describe('Dashboard — prioridade da recomendação é case-sensitive', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
  })

  it('HIGH ou alta não mostram o selo de alta prioridade', async () => {
    const mounted = await mountDashboard()
    wrapper = mounted.wrapper
    const { analysisStore } = mounted

    analysisStore.recommendations = [
      {
        id: 10,
        message: 'Comprar PETR4',
        priority: 'HIGH',
        createdAt: '2026-10-05T10:00:00.000Z'
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentRecommendation.priority).toBe('HIGH')
    expect(wrapper.find('.alerta').exists()).toBe(false)

    analysisStore.recommendations = [
      {
        id: 11,
        message: 'Comprar VALE3',
        priority: 'alta',
        createdAt: '2026-10-05T11:00:00.000Z'
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.alerta').exists()).toBe(false)
  })

  it('priority high minúsculo exibe Oportunidade de Alta Prioridade', async () => {
    const mounted = await mountDashboard()
    wrapper = mounted.wrapper
    const { analysisStore } = mounted

    analysisStore.recommendations = [
      {
        id: 12,
        message: 'Rebalancear FIIs',
        priority: 'high',
        createdAt: '2026-10-05T12:00:00.000Z'
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.alerta').exists()).toBe(true)
    expect(wrapper.find('.alerta').text()).toContain('Oportunidade de Alta Prioridade')
  })
})
