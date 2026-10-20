import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { requirePermission } from '@/middleware/auth'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('Router — /403 aponta para Forbidden.vue ausente (ChunkLoadError + reload)', () => {
  const routerSource = readFileSync(resolve(process.cwd(), 'src/router/index.js'), 'utf8')
  const forbiddenPath = resolve(process.cwd(), 'src/views/Forbidden.vue')

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('a rota Forbidden existe no router e o arquivo da view não', () => {
    expect(routerSource).toContain("path: '/403'")
    expect(routerSource).toContain("name: 'Forbidden'")
    expect(routerSource).toContain("import('@/views/Forbidden.vue')")
    expect(existsSync(forbiddenPath)).toBe(false)
  })

  it('ChunkLoadError recarrega a página — view ausente entra em loop de reload', () => {
    expect(routerSource).toContain("error.name === 'ChunkLoadError'")
    expect(routerSource).toContain('window.location.reload()')
    expect(routerSource).toContain("router.push('/500')")
  })

  it('requirePermission sem a permissão redireciona para Forbidden', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 4, email: 'ana@exemplo.com', permissions: ['portfolio:read'] }
    const next = vi.fn()

    await requirePermission('brokers:admin')(
      { fullPath: '/corretoras' },
      {},
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith({
      name: 'Forbidden',
      params: { requiredPermission: 'brokers:admin' }
    })
    expect(existsSync(forbiddenPath)).toBe(false)
  })

  it('requirePermission com a permissão libera next() sem Forbidden', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 4, email: 'ana@exemplo.com', permissions: ['brokers:admin'] }
    const next = vi.fn()

    await requirePermission('brokers:admin')(
      { fullPath: '/corretoras' },
      {},
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
  })
})
