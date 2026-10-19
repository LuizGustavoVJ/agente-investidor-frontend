import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'
import { authAPI } from '@/api/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('Auth — logout limpa o usuário e deixa carteira, análises e corretoras', () => {
  let authStore
  let portfolioStore
  let analysisStore
  let brokersStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    portfolioStore = usePortfolioStore()
    analysisStore = useAnalysisStore()
    brokersStore = useBrokersStore()
    vi.clearAllMocks()
    window.location.pathname = '/'
  })

  it('logout em / não redireciona e não chama clearData das outras stores', async () => {
    authStore.user = { id: 7, email: 'ana@exemplo.com', name: 'Ana' }
    sessionStorage.setItem('user', JSON.stringify(authStore.user))

    portfolioStore.assets = [{ symbol: 'PETR4', currentValue: 12000 }]
    portfolioStore.goals = [{ id: 1, title: 'Reserva', currentValue: 8000 }]
    portfolioStore.summary = { totalValue: 12000 }
    analysisStore.recommendations = [{ id: 99, asset: 'VALE3', status: 'pending' }]
    analysisStore.savedAnalyses = [{ id: 3, title: 'Value' }]
    brokersStore.connectedBrokers = [{ id: 'xp', name: 'XP' }]
    brokersStore.error = 'timeout anterior'

    authAPI.logout.mockResolvedValue({ data: { success: true } })

    await authStore.logout()

    expect(authAPI.logout).toHaveBeenCalledTimes(1)
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    expect(window.location.href).toBe('http://localhost:3000')

    expect(portfolioStore.assets).toEqual([{ symbol: 'PETR4', currentValue: 12000 }])
    expect(portfolioStore.goals).toEqual([{ id: 1, title: 'Reserva', currentValue: 8000 }])
    expect(portfolioStore.totalValue).toBe(12000)
    expect(analysisStore.recommendations).toEqual([{ id: 99, asset: 'VALE3', status: 'pending' }])
    expect(analysisStore.savedAnalyses).toEqual([{ id: 3, title: 'Value' }])
    expect(brokersStore.connectedBrokers).toEqual([{ id: 'xp', name: 'XP' }])
    expect(brokersStore.error).toBe('timeout anterior')
  })

  it('logout com API falhando ainda deixa o patrimônio na store', async () => {
    authStore.user = { id: 1, email: 'a@b.com' }
    portfolioStore.assets = [{ symbol: 'ITUB4', currentValue: 3000 }]
    authAPI.logout.mockRejectedValue(new Error('network'))

    await authStore.logout()

    expect(authStore.user).toBeNull()
    expect(portfolioStore.assets[0].symbol).toBe('ITUB4')
    expect(portfolioStore.assets[0].currentValue).toBe(3000)
  })
})
