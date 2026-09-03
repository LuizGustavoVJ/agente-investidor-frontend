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
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/metas', name: 'Metas', component: { template: '<div>Metas</div>' } },
    { path: '/analises', name: 'Analises', component: { template: '<div>Analises</div>' } },
    { path: '/portfolio', name: 'Portfolio', component: { template: '<div>Portfolio</div>' } },
    { path: '/corretoras', name: 'Corretoras', component: { template: '<div>Corretoras</div>' } }
  ]
})

const normalizeMoney = (text) => text.replace(/\u00a0/g, ' ').replace(/\u202f/g, ' ')

describe('Dashboard', () => {
  let wrapper
  let pinia
  let authStore
  let portfolioStore
  let analysisStore
  let brokersStore

  const mountDashboard = async () => {
    wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router],
        stubs: {
          'router-link': {
            props: ['to'],
            template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>'
          }
        }
      }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  }

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
    authStore = useAuthStore()
    portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
    brokersStore = useBrokersStore()

    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(portfolioStore, 'syncBrokers').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'markAlertAsRead').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('mostra loading inicial e depois o conteúdo', async () => {
    let resolveLoad
    portfolioStore.loadAllData.mockReturnValue(new Promise((resolve) => {
      resolveLoad = resolve
    }))

    wrapper = mount(Dashboard, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })

    expect(wrapper.text()).toContain('Carregando seus dados')

    resolveLoad({ success: true })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Carregando seus dados')
    expect(wrapper.text()).toContain('Patrimônio Total')
  })

  it('exibe estado de erro da store e permite retry', async () => {
    await mountDashboard()
    portfolioStore.error = 'Falha ao buscar portfolio'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Erro ao carregar dados')
    expect(wrapper.text()).toContain('Falha ao buscar portfolio')

    await wrapper.find('.retry-button').trigger('click')
    await flushPromises()

    expect(portfolioStore.loadAllData).toHaveBeenCalled()
  })

  it('usa o nome do usuário e cai para o e-mail ou Usuário', async () => {
    authStore.user = { name: 'Ana Costa', email: 'ana@email.com' }
    await mountDashboard()
    expect(wrapper.text()).toContain('Olá, Ana Costa')

    authStore.user = { email: 'ana@email.com' }
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Olá, ana')

    authStore.user = null
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Olá, Usuário')
  })

  it('formata patrimônio, variação positiva e aportes', async () => {
    await mountDashboard()
    portfolioStore.summary = {
      totalValue: 125000.5,
      totalGain: 15000,
      totalGainPercent: 12.5,
      totalInvested: 110000
    }
    await wrapper.vm.$nextTick()

    const text = normalizeMoney(wrapper.text())
    expect(text).toMatch(/R\$\s*125\.000,50/)
    expect(text).toMatch(/R\$\s*110\.000,00/)
    expect(wrapper.find('.card-variation').classes()).toContain('positivo')
  })

  it('marca variação negativa e nula com a classe correta', async () => {
    await mountDashboard()

    portfolioStore.summary = { totalValue: 80, totalGain: -20, totalGainPercent: -20, totalInvested: 100 }
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.card-variation').classes()).toContain('negativo')

    portfolioStore.summary = { totalValue: 100, totalGain: 0, totalGainPercent: 0, totalInvested: 100 }
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.card-variation').classes()).toContain('neutro')
  })

  it('mostra estados vazios de metas e ativos', async () => {
    await mountDashboard()

    expect(wrapper.text()).toContain('Nenhuma meta definida')
    expect(wrapper.text()).toContain('Nenhum ativo encontrado')
    expect(wrapper.find('.create-goal-btn').exists()).toBe(true)
    expect(wrapper.find('.connect-broker-btn').exists()).toBe(true)
  })

  it('lista metas ativas, progresso limitado a 100% e top ativos', async () => {
    await mountDashboard()

    portfolioStore.summary = { totalValue: 50000, totalGain: 0, totalGainPercent: 0, totalInvested: 50000 }
    portfolioStore.goals = [
      { id: 1, name: 'Aposentadoria', targetAmount: 10000, status: 'active' },
      { id: 2, name: 'Viagem', targetAmount: 5000, status: 'paused' },
      { id: 3, name: 'Reserva', targetAmount: 8000, status: 'completed' }
    ]
    portfolioStore.assets = [
      { symbol: 'VALE3', name: 'Vale', broker: 'XP', quantity: 10, currentPrice: 80, currentValue: 800, variation: 1.2 },
      { symbol: 'PETR4', name: 'Petrobras', broker: 'Clear', quantity: 100, currentPrice: 30, currentValue: 3000, variation: -2.5 }
    ]
    portfolioStore.allocation = {
      byType: {
        stocks: { percentage: 60 },
        fiis: { percentage: 40 }
      }
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Aposentadoria')
    expect(wrapper.text()).not.toContain('Viagem')
    expect(wrapper.text()).toContain('Metas')
    expect(wrapper.find('.meta-progress').attributes('style')).toContain('100%')

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('PETR4')
    expect(rows[1].text()).toContain('VALE3')
    expect(rows[1].find('.positive').exists()).toBe(true)
    expect(rows[0].find('.negative').exists()).toBe(true)

    expect(wrapper.text()).toContain('Ações')
    expect(wrapper.text()).toContain('FIIs')
  })

  it('mostra só alertas críticos ativos e marca como lido', async () => {
    await mountDashboard()
    analysisStore.alerts = [
      { id: 1, message: 'Queda acentuada em PETR4', isRead: false, status: 'active', priority: 'critical' },
      { id: 2, message: 'Alerta baixo', isRead: false, status: 'active', priority: 'low' },
      { id: 3, message: 'Já lido', isRead: true, status: 'active', priority: 'critical' }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Queda acentuada em PETR4')
    expect(wrapper.text()).not.toContain('Alerta baixo')
    expect(wrapper.text()).not.toContain('Já lido')

    await wrapper.find('.alert-dismiss').trigger('click')
    expect(analysisStore.markAlertAsRead).toHaveBeenCalledWith(1)
  })

  it('exibe recomendação de alta prioridade e navega para análises', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    await mountDashboard()

    analysisStore.recommendations = [
      { id: 2, message: 'Recomendação antiga', priority: 'low', createdAt: '2026-01-01T10:00:00Z' },
      { id: 1, message: 'Comprar PETR4', priority: 'high', createdAt: '2026-02-01T10:00:00Z' }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Comprar PETR4')
    expect(wrapper.text()).toContain('Oportunidade de Alta Prioridade')
    expect(wrapper.find('.btn-aceitar').exists()).toBe(true)

    await wrapper.find('.btn-ver-mais').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/analises')
  })

  it('navega para metas ao criar a primeira meta', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    await mountDashboard()

    await wrapper.find('.create-goal-btn').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/metas')
  })

  it('sincroniza dados e avisa sucesso', async () => {
    await mountDashboard()

    await wrapper.find('.sync-button').trigger('click')
    await flushPromises()

    expect(mockToast.info).toHaveBeenCalledWith('Sincronizando dados...')
    expect(portfolioStore.syncBrokers).toHaveBeenCalled()
    expect(portfolioStore.loadAllData).toHaveBeenCalled()
    expect(analysisStore.loadAllData).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('Dados sincronizados com sucesso!')
  })

  it('mostra erro de toast quando a sincronização falha', async () => {
    await mountDashboard()
    portfolioStore.syncBrokers.mockRejectedValueOnce(new Error('timeout'))

    await wrapper.find('.sync-button').trigger('click')
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Erro na sincronização dos dados')
  })

  it('formata valores nulos como zero e percentuais pt-BR', async () => {
    await mountDashboard()
    expect(normalizeMoney(wrapper.text())).toMatch(/R\$\s*0,00/)

    portfolioStore.summary = { totalValue: 0, totalGain: 0, totalGainPercent: 1.5, totalInvested: 0 }
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toMatch(/1,50\s*%/)
  })
})
