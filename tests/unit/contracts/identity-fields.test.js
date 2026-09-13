import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'
import Dashboard from '@/components/Dashboard.vue'
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

describe('Contrato de identidade — name vs firstName/lastName', () => {
  let pinia

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}))
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('Cadastro envia um único campo name; a store de auth persiste user.name', async () => {
    const authStore = useAuthStore()
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/cadastro', name: 'Cadastro', component: { template: '<div />' } },
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        { path: '/login', name: 'Login', component: { template: '<div />' } },
        { path: '/termos', name: 'Termos', component: { template: '<div />' } },
        { path: '/privacidade', name: 'Privacidade', component: { template: '<div />' } }
      ]
    })
    await router.push('/cadastro')
    await router.isReady()

    const wrapper = mount(Cadastro, {
      global: { plugins: [pinia, router] }
    })

    await wrapper.find('#name').setValue('João Silva')
    await wrapper.find('#email').setValue('joao@email.com')
    await wrapper.find('#password').setValue('SenhaForte1')
    await wrapper.find('#confirmPassword').setValue('SenhaForte1')
    await wrapper.findAll('input[type="checkbox"]')[0].setValue(true)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'João Silva',
        email: 'joao@email.com'
      })
    )
    expect(registerSpy.mock.calls[0][0]).not.toHaveProperty('firstName')
    expect(registerSpy.mock.calls[0][0]).not.toHaveProperty('lastName')

    wrapper.unmount()
  })

  it('Dashboard lê user.name; firstName/lastName da Configuração não aparecem no cumprimento', async () => {
    const authStore = useAuthStore()
    const portfolioStore = usePortfolioStore()
    const analysisStore = useAnalysisStore()
    const brokersStore = useBrokersStore()

    authStore.user = { firstName: 'João', lastName: 'Silva', email: 'joao@email.com' }
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
    await flushPromises()

    expect(wrapper.vm.userDisplayName).toBe('joao')
    expect(wrapper.text()).not.toContain('João Silva')
    expect(wrapper.text()).not.toContain('João')

    wrapper.unmount()
  })

  it('Configurações hidrata firstName/lastName e ignora o name enviado no cadastro', async () => {
    const authStore = useAuthStore()
    authStore.user = { name: 'João Silva', email: 'joao@email.com' }
    authStore.loadUserSettings = vi.fn().mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } }
      ]
    })
    await router.push('/configuracoes')
    await router.isReady()

    const wrapper = mount(Configuracoes, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()

    expect(wrapper.vm.profileForm.firstName).toBe('')
    expect(wrapper.vm.profileForm.lastName).toBe('')
    expect(wrapper.vm.profileForm.email).toBe('joao@email.com')
    expect(wrapper.find('#firstName').element.value).toBe('')
    expect(wrapper.find('#lastName').element.value).toBe('')

    wrapper.unmount()
  })
})
