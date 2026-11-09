import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authAPI } from '@/api/auth'
import client from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn()
  }
}))

describe('authAPI — payload e endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
    client.get.mockResolvedValue({ data: { success: true } })
    client.put.mockResolvedValue({ data: { success: true } })
  })

  it('login envia apenas email e senha', async () => {
    await authAPI.login({
      email: 'ana@email.com',
      password: 'secret',
      rememberMe: true,
      extra: 'nao-deve-ir'
    })

    expect(client.post).toHaveBeenCalledWith('/auth/login', {
      email: 'ana@email.com',
      password: 'secret'
    })
  })

  it('register envia campos de cadastro sem dados extras', async () => {
    await authAPI.register({
      name: 'Ana',
      email: 'ana@email.com',
      password: 'Senha123',
      confirmPassword: 'Senha123',
      phone: '1199',
      acceptTerms: true,
      acceptMarketing: true
    })

    expect(client.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Ana',
      email: 'ana@email.com',
      password: 'Senha123',
      confirmPassword: 'Senha123',
      phone: '1199',
      acceptTerms: true
    })
  })

  it('changePassword envia senha atual, nova e confirmação', async () => {
    await authAPI.changePassword({
      currentPassword: 'old',
      newPassword: 'new',
      confirmPassword: 'new'
    })

    expect(client.put).toHaveBeenCalledWith('/auth/password', {
      currentPassword: 'old',
      newPassword: 'new',
      confirmPassword: 'new'
    })
  })

  it('confirmPasswordReset envia token e novas senhas', async () => {
    await authAPI.confirmPasswordReset({
      token: 'reset-token',
      newPassword: 'nova',
      confirmPassword: 'nova'
    })

    expect(client.post).toHaveBeenCalledWith('/auth/password/reset-confirm', {
      token: 'reset-token',
      newPassword: 'nova',
      confirmPassword: 'nova'
    })
  })

  it('checkAuth consulta /auth/me', async () => {
    await authAPI.checkAuth()
    expect(client.get).toHaveBeenCalledWith('/auth/me')
  })
})
