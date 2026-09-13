import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import Cadastro from '@/components/Cadastro.vue'
import Configuracoes from '@/views/Configuracoes.vue'
import Dashboard from '@/components/Dashboard.vue'
import CollaborativeFeatures from '@/components/CollaborativeFeatures.vue'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    data: { datasets: [] },
    options: {}
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

const stripSpaces = (value) => String(value).replace(/\s/g, '')

describe('Contratos — senha mínima e escala de percentual', () => {
  let pinia

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}))
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('Login aceita senha de 6 caracteres que Cadastro e Configurações recusam', async () => {
    const guestRouter = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'Login', component: { template: '<div />' } },
        { path: '/cadastro', name: 'Cadastro', component: { template: '<div />' } },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/termos', name: 'Termos', component: { template: '<div />' } },
        { path: '/privacidade', name: 'Privacidade', component: { template: '<div />' } }
      ]
    })
    await guestRouter.push('/login')
    await guestRouter.isReady()

    const login = mount(Login, { global: { plugins: [pinia, guestRouter] } })
    login.vm.form.email = 'user@email.com'
    login.vm.form.password = '123456'
    expect(login.vm.isFormValid).toBe(true)
    expect(login.vm.validateForm()).toBe(true)

    const cadastro = mount(Cadastro, { global: { plugins: [pinia, guestRouter] } })
    cadastro.vm.form.name = 'Ana Costa'
    cadastro.vm.form.email = 'ana@email.com'
    cadastro.vm.form.password = '123456'
    cadastro.vm.form.confirmPassword = '123456'
    cadastro.vm.form.acceptTerms = true
    expect(cadastro.vm.isFormValid).toBe(false)
    expect(cadastro.vm.validateForm()).toBe(false)
    expect(cadastro.vm.errors.password).toMatch(/8/)

    const authStore = useAuthStore()
    authStore.user = { email: 'ana@email.com', firstName: 'Ana', lastName: 'Costa' }
    authStore.loadUserSettings = vi.fn().mockResolvedValue({ success: true })

    const settingsRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } }]
    })
    await settingsRouter.push('/configuracoes')
    await settingsRouter.isReady()

    const settings = mount(Configuracoes, { global: { plugins: [pinia, settingsRouter] } })
    await flushPromises()
    settings.vm.passwordForm.currentPassword = 'antiga123'
    settings.vm.passwordForm.newPassword = '123456'
    settings.vm.passwordForm.confirmPassword = '123456'
    expect(settings.vm.validatePassword()).toBe(false)
    expect(settings.vm.passwordErrors.newPassword).toMatch(/8/)

    login.unmount()
    cadastro.unmount()
    settings.unmount()
  })

  it('a mesma fração 0.0847 vira ~0,08% no Dashboard e 8.47% no colaborativo', async () => {
    const authStore = useAuthStore()
    const portfolioStore = usePortfolioStore()
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()
    authStore.user = { name: 'Ana' }
    vi.spyOn(portfolioStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(analysisStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }]
    })
    await router.push('/dashboard')
    await router.isReady()

    const dashboard = mount(Dashboard, { global: { plugins: [pinia, router] } })
    await flushPromises()
    const collaborative = mount(CollaborativeFeatures)

    const decimalReturn = 0.0847
    expect(stripSpaces(dashboard.vm.formatPercent(decimalReturn))).toMatch(/0,08%/)
    expect(collaborative.vm.formatPercentage(decimalReturn)).toBe('8.47%')

    dashboard.unmount()
    collaborative.unmount()
  })
})
