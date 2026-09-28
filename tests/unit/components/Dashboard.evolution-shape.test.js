import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({ destroy: vi.fn() }))
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

import Dashboard from '@/components/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/dashboard', component: { template: '<div />' } },
    { path: '/metas', component: { template: '<div />' } }
  ]
})

describe('Dashboard — evolução com shape de objeto quebra o gráfico', () => {
  let wrapper
  let portfolioStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    portfolioStore.loadAllData = vi.fn().mockResolvedValue({ success: true })
    analysisStore.loadAllData = vi.fn().mockResolvedValue({ success: true })
    brokersStore.loadAllData = vi.fn().mockResolvedValue({ success: true })

    wrapper = mount(Dashboard, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })

    await router.isReady()
    await flushPromises()
  })

  it('createEvolutionChart lança quando evolution é objeto (não array)', async () => {
    portfolioStore.evolution = {
      labels: ['Jan', 'Fev'],
      values: [1000, 1200]
    }

    const canvas = wrapper.find('#evolucaoPatrimonio')
    expect(canvas.exists()).toBe(true)

    expect(() => wrapper.vm.createEvolutionChart()).toThrow()
  })

  it('createEvolutionChart retorna cedo quando evolution é null', () => {
    portfolioStore.evolution = null

    expect(() => wrapper.vm.createEvolutionChart()).not.toThrow()
  })
})
