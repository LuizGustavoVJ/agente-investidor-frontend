import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const authAPI = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  updateProfile: vi.fn()
}))

vi.mock('@/api/auth', () => ({ authAPI }))

import { useAuthStore } from '@/stores/auth'

describe('Auth store — login com success sem user', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('devolve success true mas não autentica quando a API omite user', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true }
    })

    const store = useAuthStore()
    const result = await store.login({
      email: 'ana@email.com',
      password: 'senha123'
    })

    expect(result).toEqual({ success: true })
    expect(store.user).toBeUndefined()
    expect(store.isAuthenticated).toBe(false)
    expect(store.error).toBeNull()
    expect(sessionStorage.setItem).toHaveBeenCalledWith('user', undefined)
  })

  it('updateProfile com success e sem user espalha undefined e mantém o perfil local', async () => {
    const store = useAuthStore()
    store.user = { id: 'u-1', name: 'Ana', email: 'ana@email.com' }
    authAPI.updateProfile.mockResolvedValue({
      data: { success: true }
    })

    const result = await store.updateProfile({ name: 'Ana Silva' })

    expect(result).toEqual({ success: true })
    expect(store.user).toEqual({ id: 'u-1', name: 'Ana', email: 'ana@email.com' })
  })
})
