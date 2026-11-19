import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import client from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const responseRejected = () => client.interceptors.response.handlers[0].rejected
const requestFulfilled = () => client.interceptors.request.handlers[0].fulfilled

describe('Cliente HTTP — bordas do interceptor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.location.pathname = '/dashboard'
    window.location.href = 'http://localhost:3000/dashboard'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('401 sem error.config lança TypeError em vez de rejeitar o 401 original', async () => {
    await expect(responseRejected()({
      response: { status: 401, data: { message: 'expired' } }
    })).rejects.toThrow(TypeError)
  })

  it('erro de rede sem config e sem response não tenta refresh nem logout', async () => {
    const authStore = useAuthStore()
    const logoutSpy = vi.spyOn(authStore, 'logout').mockResolvedValue()
    const postSpy = vi.spyOn(client, 'post')

    await expect(responseRejected()({ message: 'Network Error' })).rejects.toMatchObject({
      message: 'Network Error'
    })

    expect(postSpy).not.toHaveBeenCalled()
    expect(logoutSpy).not.toHaveBeenCalled()
  })

  it('em DEV o interceptor de request registra o body — senha aparece no log', () => {
    const config = {
      method: 'post',
      url: '/auth/login',
      data: { email: 'ana@ex.com', password: 'supersecret' },
      headers: {}
    }

    const returned = requestFulfilled()(config)

    expect(returned).toBe(config)
    expect(config.headers['X-Requested-With']).toBe('XMLHttpRequest')
    const logged = JSON.stringify(console.log.mock.calls)
    expect(logged).toContain('supersecret')
  })

  it('401 em /recuperar-senha, /403 e /manutencao redireciona para /login (rotas públicas incompletas)', async () => {
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'logout').mockResolvedValue()
    vi.spyOn(client, 'post').mockRejectedValue(new Error('refresh failed'))

    for (const pathname of ['/recuperar-senha', '/403', '/manutencao']) {
      window.location.pathname = pathname
      window.location.href = `http://localhost:3000${pathname}`

      await expect(responseRejected()({
        config: { url: '/auth/me', method: 'get' },
        response: { status: 401, data: { message: 'expired' } }
      })).rejects.toBeTruthy()

      expect(window.location.href).toBe('/login')
    }
  })

  it('401 com _retry já marcado não chama refresh nem logout de novo', async () => {
    const authStore = useAuthStore()
    const logoutSpy = vi.spyOn(authStore, 'logout').mockResolvedValue()
    const postSpy = vi.spyOn(client, 'post')
    const original = { url: '/portfolio/summary', method: 'get', _retry: true }

    await expect(responseRejected()({
      config: original,
      response: { status: 401, data: { message: 'expired' } }
    })).rejects.toBeTruthy()

    expect(postSpy).not.toHaveBeenCalled()
    expect(logoutSpy).not.toHaveBeenCalled()
  })

  it('403 e 500 não disparam logout', async () => {
    const authStore = useAuthStore()
    const logoutSpy = vi.spyOn(authStore, 'logout').mockResolvedValue()

    await expect(responseRejected()({
      config: { url: '/admin', method: 'get' },
      response: { status: 403, data: { message: 'forbidden' } }
    })).rejects.toBeTruthy()

    await expect(responseRejected()({
      config: { url: '/portfolio/summary', method: 'get' },
      response: { status: 500, data: { message: 'boom' } }
    })).rejects.toBeTruthy()

    expect(logoutSpy).not.toHaveBeenCalled()
  })
})
