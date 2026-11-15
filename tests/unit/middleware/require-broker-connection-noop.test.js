import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { requireBrokerConnection } from '@/middleware/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    checkAuth: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn()
  }
}))

const middlewareSource = readFileSync(
  resolve(__dirname, '../../../src/middleware/auth.js'),
  'utf8'
)
const routerSource = readFileSync(resolve(__dirname, '../../../src/router/index.js'), 'utf8')

describe('requireBrokerConnection — autenticado sem corretora passa', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
  })

  it('o guard não consulta brokers store e o router nunca o aplica', () => {
    const fn = middlewareSource.slice(
      middlewareSource.indexOf('export const requireBrokerConnection'),
      middlewareSource.indexOf('export const logNavigation')
    )

    expect(fn).toMatch(/Por enquanto, vamos assumir que está ok/)
    expect(fn).toMatch(/next\(\)/)
    expect(fn).not.toMatch(/useBrokersStore|connectedBrokers|fetchConnectedBrokers/)
    expect(routerSource).not.toMatch(/requireBrokerConnection/)
  })

  it('usuário autenticado sem corretoras conectadas segue para /corretoras', async () => {
    authStore.user = { id: 7, name: 'Ana Souza', email: 'ana@investidor.test' }

    const next = vi.fn()
    await requireBrokerConnection(
      { fullPath: '/corretoras', name: 'Corretoras' },
      { name: 'Dashboard' },
      next
    )

    expect(authStore.isAuthenticated).toBe(true)
    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
    expect(next).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Corretoras' })
    )
  })

  it('não autenticado ainda redireciona para Login com redirect', async () => {
    const next = vi.fn()
    await requireBrokerConnection(
      { fullPath: '/corretoras', name: 'Corretoras' },
      { name: 'Home' },
      next
    )

    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/corretoras' }
    })
  })
})
