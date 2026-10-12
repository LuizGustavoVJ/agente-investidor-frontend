import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('Configuracoes — investorProfile parcial substitui o formulário inteiro', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()

    store.user = {
      id: 9,
      firstName: 'Bruno',
      lastName: 'Nunes',
      email: 'bruno@exemplo.com',
      investorProfile: {
        riskProfile: 'aggressive',
        timeHorizon: 'long'
      },
      privacySettings: {
        analytics: false
      }
    }
    store.error = null
    store.loadUserSettings = vi.fn().mockResolvedValue({ success: true })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } }
      ]
    })

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('spread de investorProfile incompleto apaga experienceLevel e monthlyInvestment', () => {
    expect(store.loadUserSettings).toHaveBeenCalled()
    expect(wrapper.vm.investorForm.riskProfile).toBe('aggressive')
    expect(wrapper.vm.investorForm.timeHorizon).toBe('long')
    expect(wrapper.vm.investorForm.experienceLevel).toBeUndefined()
    expect(wrapper.vm.investorForm.monthlyIncome).toBeUndefined()
    expect(wrapper.vm.investorForm.investmentGoal).toBeUndefined()
    expect(wrapper.vm.investorForm.monthlyInvestment).toBeUndefined()
  })

  it('spread de privacySettings incompleto deixa personalization/aggregatedData indefinidos', () => {
    expect(wrapper.vm.privacyForm.analytics).toBe(false)
    expect(wrapper.vm.privacyForm.personalization).toBeUndefined()
    expect(wrapper.vm.privacyForm.aggregatedData).toBeUndefined()
  })

  it('abrir a seção Investidor com campos indefinidos ainda renderiza os selects', async () => {
    wrapper.vm.activeSection = 'investor'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#investmentGoal').exists()).toBe(true)
    expect(wrapper.find('#monthlyInvestment').element.value).toBe('')
  })
})
