import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'
import { useAuthStore } from '@/stores/auth'
import { portfolioAPI } from '@/api/portfolio'
import { analysisAPI } from '@/api/analysis'
import { brokersAPI } from '@/api/brokers'
import { authAPI } from '@/api/auth'
import client from '@/api/client'

const ok = (data = {}) => Promise.resolve({ data: { success: true, data } })

describe('Stores — corrida de loading e identidade', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loadAllData do portfolio zera isLoading quando fetchSummary termina, ainda com irmãos em voo', async () => {
    let resolveAllocation
    vi.spyOn(portfolioAPI, 'getSummary').mockResolvedValue({
      data: { success: true, data: { totalValue: 1 } }
    })
    vi.spyOn(portfolioAPI, 'getAllocation').mockImplementation(
      () => new Promise(resolve => { resolveAllocation = resolve })
    )
    vi.spyOn(portfolioAPI, 'getEvolution').mockResolvedValue(ok([]))
    vi.spyOn(portfolioAPI, 'getAssets').mockResolvedValue(ok([]))
    vi.spyOn(portfolioAPI, 'getTransactions').mockResolvedValue(ok([]))
    vi.spyOn(portfolioAPI, 'getGoals').mockResolvedValue(ok([]))
    vi.spyOn(portfolioAPI, 'getPerformance').mockResolvedValue(ok({}))

    const store = usePortfolioStore()
    const pending = store.loadAllData()

    await vi.waitFor(() => {
      expect(store.summary).toEqual({ totalValue: 1 })
    })
    expect(store.isLoading).toBe(false)

    resolveAllocation({ data: { success: true, data: { byType: {} } } })
    await pending
  })

  it('loadAllData de analysis zera isLoading quando fetchMethodologies termina cedo', async () => {
    let resolveAlerts
    vi.spyOn(analysisAPI, 'getMethodologies').mockResolvedValue(ok([{ id: 'm1' }]))
    vi.spyOn(analysisAPI, 'getRecommendations').mockResolvedValue(ok([]))
    vi.spyOn(analysisAPI, 'getAlerts').mockImplementation(
      () => new Promise(resolve => { resolveAlerts = resolve })
    )
    vi.spyOn(analysisAPI, 'getAnalysisHistory').mockResolvedValue(ok([]))
    vi.spyOn(analysisAPI, 'getMarketAnalysis').mockResolvedValue(ok({}))
    vi.spyOn(analysisAPI, 'getSavedAnalyses').mockResolvedValue(ok([]))

    const store = useAnalysisStore()
    const pending = store.loadAllData()

    await vi.waitFor(() => {
      expect(store.methodologies).toEqual([{ id: 'm1' }])
    })
    expect(store.isLoading).toBe(false)

    resolveAlerts({ data: { success: true, data: [] } })
    await pending
  })

  it('syncAllBrokers marca isRunning=true depois do sucesso (estado invertido)', async () => {
    vi.spyOn(brokersAPI, 'syncAllBrokers').mockResolvedValue(ok({}))
    const store = useBrokersStore()
    store.connectedBrokers = [{ connectionId: 'c1', status: 'active' }]

    const result = await store.syncAllBrokers()

    expect(result.success).toBe(true)
    expect(store.syncStatus.c1.isRunning).toBe(true)
    expect(store.isSyncing).toBe(true)
  })

  it('getSyncStatus(0) e getSyncStatus("") usam a URL geral porque 0/"" são falsy', () => {
    const getSpy = vi.spyOn(client, 'get').mockResolvedValue(ok({}))

    brokersAPI.getSyncStatus(0)
    brokersAPI.getSyncStatus('')
    brokersAPI.getSyncStatus(null)

    expect(getSpy.mock.calls.map(c => c[0])).toEqual([
      '/brokers/sync/status',
      '/brokers/sync/status',
      '/brokers/sync/status'
    ])
  })

  it('updateGoal e deleteGoal usam === — id numérico não casa com string', async () => {
    vi.spyOn(portfolioAPI, 'updateGoal').mockResolvedValue({
      data: { success: true, data: { id: '1', name: 'Atualizada' } }
    })
    vi.spyOn(portfolioAPI, 'deleteGoal').mockResolvedValue({ data: { success: true } })

    const store = usePortfolioStore()
    store.goals = [{ id: 1, name: 'Original' }]

    await store.updateGoal('1', { name: 'Atualizada' })
    expect(store.goals[0].name).toBe('Original')

    await store.deleteGoal('1')
    expect(store.goals).toHaveLength(1)
  })

  it('markAlertAsRead ignora alerta quando id é string vs número', async () => {
    vi.spyOn(analysisAPI, 'markAlertAsRead').mockResolvedValue({ data: { success: true } })
    const store = useAnalysisStore()
    store.alerts = [{ id: 7, isRead: false, status: 'active', priority: 'critical' }]

    await store.markAlertAsRead('7')
    expect(store.alerts[0].isRead).toBe(false)
  })

  it('criticalAlerts exige priority === "critical" em minúsculas', () => {
    const store = useAnalysisStore()
    store.alerts = [
      { id: 1, isRead: false, status: 'active', priority: 'CRITICAL' },
      { id: 2, isRead: false, status: 'active', priority: 'high' },
      { id: 3, isRead: false, status: 'active', priority: 'critical' }
    ]
    expect(store.criticalAlerts.map(a => a.id)).toEqual([3])
  })

  it('topAssets ordena in-place e muta o array original', () => {
    const store = usePortfolioStore()
    const original = [
      { symbol: 'A', currentValue: 10 },
      { symbol: 'B', currentValue: 30 },
      { symbol: 'C', currentValue: 20 }
    ]
    store.assets = original

    expect(store.topAssets[0].symbol).toBe('B')
    expect(store.assets[0].symbol).toBe('B')
    expect(original[0].symbol).toBe('B')
  })

  it('updateProfile com user null e payload sem user deixa {} — isAuthenticated vira true', async () => {
    vi.spyOn(authAPI, 'updateProfile').mockResolvedValue({
      data: { success: true }
    })
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)

    const result = await store.updateProfile({ firstName: 'Ana' })

    expect(result.success).toBe(true)
    expect(store.user).toEqual({})
    expect(store.isAuthenticated).toBe(true)
  })

  it('checkAuthStatus hidrata usuário stale do sessionStorage antes da API responder', async () => {
    sessionStorage.getItem.mockReturnValue(JSON.stringify({ id: 1, name: 'Stale' }))
    let resolveAuth
    vi.spyOn(authAPI, 'checkAuth').mockImplementation(
      () => new Promise(resolve => { resolveAuth = resolve })
    )

    const store = useAuthStore()
    const pending = store.checkAuthStatus()

    await vi.waitFor(() => {
      expect(store.user).toEqual({ id: 1, name: 'Stale' })
    })
    expect(store.isAuthenticated).toBe(true)

    resolveAuth({ data: { success: true, user: { id: 1, name: 'Fresh' } } })
    await pending
    expect(store.user.name).toBe('Fresh')
  })

  it('clearData do portfolio não zera isLoading nem error', () => {
    const store = usePortfolioStore()
    store.isLoading = true
    store.error = 'falhou'
    store.summary = { totalValue: 10 }
    store.clearData()

    expect(store.summary).toBeNull()
    expect(store.isLoading).toBe(true)
    expect(store.error).toBe('falhou')
  })

  it('compareAssets envia string crua; getBenchmarkComparison(string) lança', () => {
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({ data: {} })
    analysisAPI.compareAssets('PETR4')
    expect(postSpy).toHaveBeenCalledWith('/analysis/compare', { symbols: 'PETR4' })

    expect(() => portfolioAPI.getBenchmarkComparison('IBOV')).toThrow()
  })
})
