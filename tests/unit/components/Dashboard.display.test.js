import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('chart.js/auto', () => ({
  default: vi.fn(() => ({ destroy: vi.fn(), update: vi.fn(), getContext: vi.fn() }))
}))

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Dashboard — formatação, identidade e sync cego', () => {
  let wrapper
  let pinia
  let router
  let authStore
  let portfolioStore
  let analysisStore
  let brokersStore

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    toast.success.mockClear()
    toast.error.mockClear()
    toast.info.mockClear()

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/dashboard', component: { template: '<div />' } },
        { path: '/analises', component: { template: '<div />' } },
        { path: '/metas', component: { template: '<div />' } }
      ]
    })
    await router.push('/dashboard')
    await router.isReady()

    authStore = useAuthStore()
    portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
    brokersStore = useBrokersStore()

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}))
    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(portfolioStore, 'syncBrokers').mockResolvedValue({ success: true })

    wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router],
        stubs: { canvas: true }
      }
    })
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('userDisplayName cai para a parte local do email e depois para Usuário', async () => {
    authStore.user = { name: 'Ana' }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.userDisplayName).toBe('Ana')

    authStore.user = { email: 'ana@ex.com' }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.userDisplayName).toBe('ana')

    authStore.user = null
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.userDisplayName).toBe('Usuário')
  })

  it('formatPercent trata o valor como percentual e aplica style:percent (divide por 100)', () => {
    expect(wrapper.vm.formatPercent(null)).toBe('0,00%')
    expect(wrapper.vm.formatPercent(15.5)).toBe('15,50%')
    expect(wrapper.vm.formatPercent(0.155)).toBe('0,16%')
  })

  it('formatCurrency com showSign prefixa +/- no valor absoluto', () => {
    expect(wrapper.vm.formatCurrency(null)).toMatch(/R\$\s*0,00/)
    const negative = wrapper.vm.formatCurrency(-100, true)
    const positive = wrapper.vm.formatCurrency(100, true)
    expect(negative.startsWith('-')).toBe(true)
    expect(negative).toContain('100,00')
    expect(positive.startsWith('+')).toBe(true)
    expect(positive).toContain('100,00')
    expect(wrapper.vm.formatCurrency(0, true)).toMatch(/R\$\s*0,00/)
  })

  it('gainClass é neutro em 0, não em null (null vira 0 no getter)', async () => {
    portfolioStore.summary = { totalGainPercent: 0 }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.gainClass).toEqual({ positivo: false, negativo: false, neutro: true })

    portfolioStore.summary = { totalGainPercent: -1 }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.gainClass.negativo).toBe(true)
  })

  it('syncData toast.success mesmo quando as stores devolvem success:false', async () => {
    portfolioStore.syncBrokers.mockResolvedValue({ success: false, error: 'falha' })
    portfolioStore.loadAllData.mockResolvedValue({ success: false })
    analysisStore.loadAllData.mockResolvedValue({ success: false })

    await wrapper.vm.syncData()

    expect(toast.success).toHaveBeenCalledWith('Dados sincronizados com sucesso!')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('getTypeLabel desconhecido devolve o type cru', () => {
    expect(wrapper.vm.getTypeLabel('stocks')).toBe('Ações')
    expect(wrapper.vm.getTypeLabel('etf')).toBe('etf')
  })
})
