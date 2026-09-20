import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'
import Corretoras from '@/views/Corretoras.vue'
import Configuracoes from '@/views/Configuracoes.vue'
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

describe('formatDate inválida — Dashboard, Corretoras e Configurações', () => {
  let wrappers = []

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}))
    wrappers = []
  })

  afterEach(() => {
    wrappers.forEach((wrapper) => wrapper?.unmount())
  })

  it('Dashboard.formatDate com string inválida lança', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const authStore = useAuthStore()
    const portfolioStore = usePortfolioStore()
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    authStore.user = { name: 'Ana Costa' }
    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }]
    })
    await router.push('/dashboard')
    await router.isReady()

    const wrapper = mount(Dashboard, {
      global: { plugins: [pinia, router] }
    })
    wrappers.push(wrapper)
    await flushPromises()

    expect(() => wrapper.vm.formatDate('not-a-date')).toThrow()
    expect(wrapper.vm.formatDate(null)).toBe('')
  })

  it('Corretoras.formatDate e getTimeAgo com data inválida lançam', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } }]
    })
    await router.push('/corretoras')
    await router.isReady()

    const wrapper = mount(Corretoras, {
      global: { plugins: [pinia, router] }
    })
    wrappers.push(wrapper)
    await flushPromises()

    expect(wrapper.vm.formatDate(null)).toBe('Nunca')
    expect(wrapper.vm.getTimeAgo(null)).toBe('')
    expect(() => wrapper.vm.formatDate('not-a-date')).toThrow()
    expect(() => wrapper.vm.getTimeAgo('not-a-date')).toThrow()
  })

  it('Configuracoes.formatDate com string inválida lança', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const authStore = useAuthStore()
    authStore.user = {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@email.com'
    }
    authStore.loadUserSettings = vi.fn().mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } }]
    })
    await router.push('/configuracoes')
    await router.isReady()

    const wrapper = mount(Configuracoes, {
      global: { plugins: [pinia, router] }
    })
    wrappers.push(wrapper)
    await flushPromises()

    expect(wrapper.vm.formatDate(null)).toBe('Nunca')
    expect(() => wrapper.vm.formatDate('not-a-date')).toThrow()
  })
})
