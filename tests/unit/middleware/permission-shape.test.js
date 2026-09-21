import { describe, it, expect, beforeEach, vi } from 'vitest'

const authStore = vi.hoisted(() => ({
  isAuthenticated: true,
  isInitialized: true,
  user: null,
  initialize: vi.fn()
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore
}))

import { requirePermission } from '@/middleware/auth'

describe('requirePermission — formato inesperado de permissions', () => {
  const next = vi.fn()
  const to = { fullPath: '/corretoras' }
  const from = { fullPath: '/dashboard' }

  beforeEach(() => {
    vi.clearAllMocks()
    authStore.isAuthenticated = true
    authStore.isInitialized = true
    authStore.user = null
  })

  it('lança TypeError se permissions for objeto (não tem includes)', async () => {
    authStore.user = { permissions: { 'manage-brokers': true } }

    await expect(requirePermission('manage-brokers')(to, from, next)).rejects.toThrow(TypeError)
    expect(next).not.toHaveBeenCalled()
  })

  it('string de permissões usa includes de substring — "manage" passa em "manage-brokers"', async () => {
    authStore.user = { permissions: 'manage-brokers' }

    await requirePermission('manage')(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('array sem a permissão redireciona para Forbidden', async () => {
    authStore.user = { permissions: ['read-portfolio'] }

    await requirePermission('manage-brokers')(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'Forbidden',
      params: { requiredPermission: 'manage-brokers' }
    })
  })
})
