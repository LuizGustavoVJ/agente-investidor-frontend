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

describe('Dashboard — prioridade da recomendação e escala de percentual', () => {
  let wrapper
  let analysisStore

  beforeEach(async () => {
    stubCanvas()
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore()
    const portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div />' } },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/analises', name: 'Analises', component: { template: '<div />' } },
        { path: '/metas', name: 'Metas', component: { template: '<div />' } }
      ]
    })

    wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('priority "high" mostra o selo de alta prioridade', async () => {
    analysisStore.recommendations = [
      {
        id: 1,
        message: 'Comprar PETR4',
        priority: 'high',
        createdAt: '2026-09-30T10:00:00.000Z'
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.alerta').exists()).toBe(true)
    expect(wrapper.find('.alerta').text()).toContain('Oportunidade de Alta Prioridade')
  })

  it('priority "HIGH" (contrato típico de API) esconde o selo', async () => {
    analysisStore.recommendations = [
      {
        id: 2,
        message: 'Comprar VALE3',
        priority: 'HIGH',
        createdAt: '2026-09-30T11:00:00.000Z'
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Comprar VALE3')
    expect(wrapper.find('.alerta').exists()).toBe(false)
  })

  it('priority "High" também não casa com o template', async () => {
    analysisStore.recommendations = [
      {
        id: 3,
        message: 'Aumentar FIIs',
        priority: 'High',
        createdAt: '2026-09-30T12:00:00.000Z'
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.alerta').exists()).toBe(false)
  })

  it('formatPercent trata 0.125 como 0,13% (razão), não 12,50%', () => {
    const ratio = wrapper.vm.formatPercent(0.125)
    const percentPoints = wrapper.vm.formatPercent(12.5)

    expect(ratio).not.toMatch(/12/)
    expect(percentPoints).toMatch(/12/)
  })
})
