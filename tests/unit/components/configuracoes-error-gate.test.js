import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>home</div>' } },
    { path: '/configuracoes', component: { template: '<div />' } }
  ]
})

describe('Configurações: gate de erro e métodos ausentes no auth store', () => {
  let wrapper
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  async function mountView() {
    wrapper = mount(Configuracoes, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    await router.isReady()
    await flushPromises()
  }

  it('loadUserSettings inexistente é engolido: hasError fica false e a UI de settings aparece vazia', async () => {
    await mountView()

    expect(wrapper.vm.hasError).toBe(false)
    expect(wrapper.vm.isInitialLoading).toBe(false)
    expect(toast.error).toHaveBeenCalled()
    expect(wrapper.find('.configuracoes-content').exists()).toBe(true)
    expect(wrapper.find('.error-container').exists()).toBe(false)
  })

  it('erro residual do login esconde todas as abas de configuração', async () => {
    const auth = useAuthStore()
    auth.error = 'Credenciais inválidas'
    await mountView()

    expect(wrapper.vm.hasError).toBe(true)
    expect(wrapper.find('.error-container').exists()).toBe(true)
    expect(wrapper.find('.configuracoes-content').exists()).toBe(false)
    expect(wrapper.text()).toContain('Credenciais inválidas')
  })

  it('getDeviceIcon(undefined) lança TypeError', async () => {
    await mountView()
    expect(() => wrapper.vm.getDeviceIcon(undefined)).toThrow()
  })

  it('saveInvestorProfile não valida campos vazios e chama método inexistente', async () => {
    await mountView()
    wrapper.vm.investorForm = {
      riskProfile: '',
      experience: '',
      monthlyIncome: ''
    }

    await wrapper.vm.saveInvestorProfile()

    expect(toast.error).toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalledWith('Perfil de investidor atualizado!')
  })

  it('deleteAccount que resolve navega para / sem logout nem limpar sessionStorage', async () => {
    await mountView()
    const auth = useAuthStore()
    auth.user = { id: 1, name: 'Luiz' }
    auth.deleteAccount = vi.fn().mockResolvedValue({ success: true })
    const push = vi.spyOn(router, 'push').mockResolvedValue()

    await wrapper.vm.deleteAccount()

    expect(auth.deleteAccount).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/')
    expect(auth.user).toEqual({ id: 1, name: 'Luiz' })
    expect(sessionStorage.removeItem).not.toHaveBeenCalledWith('user')
  })
})
