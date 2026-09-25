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

describe('Dashboard — userDisplayName com nome em branco', () => {
  let wrapper
  let authStore

  const mountDashboard = async () => {
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
    await wrapper.vm.$nextTick()
  }

  beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}))
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.spyOn(usePortfolioStore(), 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(useAnalysisStore(), 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(useBrokersStore(), 'loadAllData').mockResolvedValue({ success: true })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('name só com espaços não cai no e-mail nem no fallback "Usuário"', async () => {
    authStore.user = { name: '   ', email: 'ana.costa@email.com' }
    await mountDashboard()

    expect(wrapper.vm.userDisplayName).toBe('   ')
    expect(wrapper.text()).toContain('Olá,')
    expect(wrapper.text()).not.toContain('ana.costa')
    expect(wrapper.text()).not.toContain('Usuário')
  })

  it('name vazio cai no prefixo do e-mail', async () => {
    authStore.user = { name: '', email: 'ana.costa@email.com' }
    await mountDashboard()

    expect(wrapper.vm.userDisplayName).toBe('ana.costa')
  })
})
