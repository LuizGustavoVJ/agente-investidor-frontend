import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import { authAPI } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store — atualização de perfil', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
  })

  it('mescla o perfil retornado e persiste só dados não sensíveis', async () => {
    store.user = { id: 7, name: 'João', phone: '11999990000' }
    authAPI.updateProfile.mockResolvedValue({
      data: {
        success: true,
        user: { name: 'João Silva', email: 'joao@email.com' }
      }
    })

    const result = await store.updateProfile({ name: 'João Silva' })

    expect(result).toEqual({ success: true })
    expect(store.user).toEqual({
      id: 7,
      name: 'João Silva',
      phone: '11999990000',
      email: 'joao@email.com'
    })
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(store.user)
    )
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('não troca o usuário quando a API devolve success false', async () => {
    store.user = { id: 7, name: 'João' }
    authAPI.updateProfile.mockResolvedValue({
      data: { success: false, message: 'E-mail já em uso' }
    })

    const result = await store.updateProfile({ email: 'outro@email.com' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('E-mail já em uso')
    expect(store.user).toEqual({ id: 7, name: 'João' })
    expect(store.error).toBe('E-mail já em uso')
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
  })

  it('usa a mensagem HTTP quando a atualização falha na rede', async () => {
    store.user = { id: 7, name: 'João' }
    const error = new Error('Network')
    error.response = { data: { message: 'Sessão expirada' } }
    authAPI.updateProfile.mockRejectedValue(error)

    const result = await store.updateProfile({ name: 'Maria' })

    expect(result).toEqual({ success: false, error: 'Sessão expirada' })
    expect(store.user).toEqual({ id: 7, name: 'João' })
    expect(store.isLoading).toBe(false)
  })
})
