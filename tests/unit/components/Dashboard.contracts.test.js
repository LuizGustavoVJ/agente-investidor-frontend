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

describe('Dashboard — contratos de metas, ativos e sessão', () => {
  let wrapper
  let pinia
  let portfolioStore

  const mountDashboard = async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/metas', name: 'Metas', component: { template: '<div />' } },
        { path: '/login', name: 'Login', component: { template: '<div />' } }
      ]
    })
    await router.push('/dashboard')
    await router.isReady()

    wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router]
      }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  }

  beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}))
    pinia = createPinia()
    setActivePinia(pinia)

    const authStore = useAuthStore()
    portfolioStore = usePortfolioStore()
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    authStore.user = { name: 'Ana Costa' }
    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    await mountDashboard()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('não lê title/targetValue da API/Metas — progresso vira NaN e o nome some', async () => {
    portfolioStore.goals = [
      {
        id: 1,
        status: 'active',
        title: 'Casa Própria',
        targetValue: 150000,
        currentValue: 45000
      }
    ]
    portfolioStore.summary = { totalValue: 45000 }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('Casa Própria')
    expect(Number.isNaN(wrapper.vm.getGoalProgress())).toBe(true)
    expect(wrapper.vm.formatCurrency(portfolioStore.activeGoals[0].targetAmount)).toBe(
      wrapper.vm.formatCurrency(undefined)
    )
  })

  it('classifica ativo sem variation como negativo e formata NaN como percentual inválido', async () => {
    portfolioStore.assets = [
      {
        symbol: 'PETR4',
        name: 'Petrobras',
        broker: 'XP',
        quantity: 10,
        currentPrice: 30,
        currentValue: 300
      }
    ]
    await wrapper.vm.$nextTick()

    const row = wrapper.findAll('tbody tr')[0]
    expect(row.findAll('td')[5].classes()).toContain('negative')
    expect(wrapper.vm.formatPercent(Number.NaN)).toMatch(/NaN/)
  })

  it('quebra o gráfico de evolução quando a API devolve objeto em vez de array', () => {
    portfolioStore.evolution = {
      points: [{ date: '2024-01-01', value: 10000 }]
    }
    expect(() => wrapper.vm.createEvolutionChart()).toThrow()
  })

  it('não oferece logout — o shell autenticado não encerra a sessão HTTP-only', () => {
    const text = wrapper.text().toLowerCase()
    expect(text).not.toContain('logout')
    expect(text).not.toContain('sair')
    expect(wrapper.find('button.logout, [data-action="logout"]').exists()).toBe(false)
  })
})
