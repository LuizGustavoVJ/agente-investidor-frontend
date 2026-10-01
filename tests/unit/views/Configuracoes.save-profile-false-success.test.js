import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'

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
    refreshToken: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn()
  }
}))

const validProfile = {
  firstName: 'Ana',
  lastName: 'Silva',
  email: 'ana@exemplo.com',
  phone: '(11) 99999-9999',
  birthDate: '1990-01-01',
  bio: 'Investidora'
}

describe('Configuracoes — saveProfile ignora { success: false }', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    mockToast.success.mockReset()
    mockToast.error.mockReset()

    store.user = {
      id: 7,
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@exemplo.com'
    }

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } },
        { path: '/', name: 'Home', component: { template: '<div />' } }
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

  it('API recusa o perfil e a view ainda tosta sucesso sem atualizar o usuário', async () => {
    authAPI.updateProfile.mockResolvedValue({
      data: { success: false, message: 'E-mail já cadastrado' }
    })

    wrapper.vm.profileForm = { ...validProfile, email: 'ocupado@exemplo.com' }

    await wrapper.vm.saveProfile()
    await flushPromises()

    expect(authAPI.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ocupado@exemplo.com' })
    )
    expect(store.user.email).toBe('ana@exemplo.com')
    expect(mockToast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalledWith('Erro ao salvar perfil')
  })

  it('saveInvestorProfile (método ausente na store) cai no catch e tosta erro', async () => {
    wrapper.vm.investorForm = {
      experienceLevel: 'beginner',
      riskProfile: 'conservative',
      monthlyIncome: 'up-to-3k',
      investmentGoal: 'retirement',
      timeHorizon: 'long',
      monthlyInvestment: 500
    }

    await wrapper.vm.saveInvestorProfile()
    await flushPromises()

    expect(store.updateInvestorProfile).toBeUndefined()
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao salvar perfil de investidor')
    expect(mockToast.success).not.toHaveBeenCalledWith('Perfil de investidor atualizado!')
  })
})
