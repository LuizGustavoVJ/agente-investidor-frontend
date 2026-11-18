import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import client, { uploadFile, setAuthHeader } from '@/api/client'
import { analysisAPI } from '@/api/analysis'
import { portfolioAPI } from '@/api/portfolio'
import { brokersAPI } from '@/api/brokers'
import { authAPI } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

describe('Contratos de encode, join e upload', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getAssetAnalysis faz join sem encode — vírgula e vazio viram query crua', () => {
    const getSpy = vi.spyOn(client, 'get').mockResolvedValue({ data: {} })

    analysisAPI.getAssetAnalysis('PETR4/B', [])
    expect(getSpy).toHaveBeenCalledWith('/analysis/asset/PETR4/B', {
      params: { methodologies: '' }
    })

    analysisAPI.getAssetAnalysis('VALE3', ['buffett', 'graham,extra'])
    expect(getSpy).toHaveBeenLastCalledWith('/analysis/asset/VALE3', {
      params: { methodologies: 'buffett,graham,extra' }
    })
  })

  it('getBenchmarkComparison e getTechnicalIndicators também juntam com vírgula crua', () => {
    const getSpy = vi.spyOn(client, 'get').mockResolvedValue({ data: {} })

    portfolioAPI.getBenchmarkComparison(['IBOV', 'CDI,SELIC'])
    expect(getSpy).toHaveBeenCalledWith('/portfolio/benchmark', {
      params: { benchmarks: 'IBOV,CDI,SELIC' }
    })

    analysisAPI.getTechnicalIndicators('PETR4', [])
    expect(getSpy).toHaveBeenCalledWith('/analysis/technical/PETR4', {
      params: { indicators: '' }
    })
  })

  it('IDs de corretora entram na URL sem encodeURIComponent', () => {
    const getSpy = vi.spyOn(client, 'get').mockResolvedValue({ data: {} })
    const delSpy = vi.spyOn(client, 'delete').mockResolvedValue({ data: {} })

    brokersAPI.disconnectBroker('xp/1')
    brokersAPI.getBrokerStatement('xp/1', '2024/01')
    brokersAPI.getShared = undefined

    expect(delSpy).toHaveBeenCalledWith('/brokers/disconnect/xp/1')
    expect(getSpy).toHaveBeenCalledWith('/brokers/statement/xp/1', {
      params: { period: '2024/01' }
    })
  })

  it('shareAnalysis e getSharedAnalysis interpolam o token cru na URL', () => {
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({ data: {} })
    const getSpy = vi.spyOn(client, 'get').mockResolvedValue({ data: {} })

    analysisAPI.shareAnalysis('id/with/slash', { email: 'a@b.com' })
    analysisAPI.getSharedAnalysis('../other')

    expect(postSpy).toHaveBeenCalledWith('/analysis/share/id/with/slash', { email: 'a@b.com' })
    expect(getSpy).toHaveBeenCalledWith('/analysis/shared/../other')
  })

  it('login descarta rememberMe; register descarta acceptMarketing', () => {
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({ data: {} })

    authAPI.login({ email: 'a@b.com', password: 'x', rememberMe: true })
    expect(postSpy.mock.calls[0][1]).toEqual({ email: 'a@b.com', password: 'x' })
    expect(postSpy.mock.calls[0][1].rememberMe).toBeUndefined()

    authAPI.register({
      name: 'Ana',
      email: 'a@b.com',
      password: 'secret12',
      confirmPassword: 'secret12',
      phone: '11999999999',
      acceptTerms: true,
      acceptMarketing: true
    })
    expect(postSpy.mock.calls[1][1].acceptMarketing).toBeUndefined()
    expect(postSpy.mock.calls[1][1].acceptTerms).toBe(true)
  })

  it('connectBroker espera objeto — id primitivo vira brokerId undefined', () => {
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({ data: {} })
    brokersAPI.connectBroker(7)
    expect(postSpy).toHaveBeenCalledWith('/brokers/connect', {
      brokerId: undefined,
      credentials: undefined,
      accountType: undefined
    })
  })

  it('uploadFile reporta Infinity quando total é 0', async () => {
    const onProgress = vi.fn()
    vi.spyOn(client, 'post').mockImplementation(async (_url, _data, config) => {
      config.onUploadProgress({ loaded: 10, total: 0 })
      return { data: { success: true } }
    })

    await uploadFile('/files', new File(['x'], 'x.txt'), onProgress)
    expect(onProgress).toHaveBeenCalledWith(Infinity)
  })

  it('setAuthHeader coloca Bearer mesmo o client sendo cookie-only', () => {
    setAuthHeader('tok-123')
    expect(client.defaults.headers.common.Authorization).toBe('Bearer tok-123')
    setAuthHeader(null)
    expect(client.defaults.headers.common.Authorization).toBeUndefined()
  })

  it('401 em rota pública fora de /, /login e /cadastro ainda redireciona para /login', async () => {
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'logout').mockResolvedValue()
    vi.spyOn(client, 'post').mockRejectedValue(new Error('refresh failed'))

    window.location.pathname = '/termos'
    window.location.href = 'http://localhost:3000/termos'

    const rejected = client.interceptors.response.handlers[0].rejected
    await expect(rejected({
      config: { url: '/auth/me', method: 'get' },
      response: { status: 401, data: { message: 'expired' } }
    })).rejects.toBeTruthy()

    expect(authStore.logout).toHaveBeenCalled()
    expect(window.location.href).toBe('/login')
  })
})
