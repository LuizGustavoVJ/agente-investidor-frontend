import { describe, it, expect, beforeEach, vi } from 'vitest'
import client from '@/api/client'
import { authAPI } from '@/api/auth'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('authAPI — contrato de payload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
    client.get.mockResolvedValue({ data: { success: true } })
    client.put.mockResolvedValue({ data: { success: true } })
  })

  it('login envia só email e senha, ignorando rememberMe', async () => {
    await authAPI.login({
      email: 'user@test.com',
      password: 'secret',
      rememberMe: true
    })

    expect(client.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@test.com',
      password: 'secret'
    })
  })

  it('register envia confirmação de senha, telefone e aceite dos termos', async () => {
    await authAPI.register({
      name: 'Ana',
      email: 'ana@test.com',
      password: 'Senha123!',
      confirmPassword: 'Senha123!',
      phone: '(11) 99999-9999',
      acceptTerms: true,
      acceptMarketing: true
    })

    expect(client.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Ana',
      email: 'ana@test.com',
      password: 'Senha123!',
      confirmPassword: 'Senha123!',
      phone: '(11) 99999-9999',
      acceptTerms: true
    })
    expect(client.post.mock.calls[0][1]).not.toHaveProperty('acceptMarketing')
  })

  it('changePassword envia senha atual, nova e confirmação', async () => {
    await authAPI.changePassword({
      currentPassword: 'old',
      newPassword: 'new-secret',
      confirmPassword: 'new-secret'
    })

    expect(client.put).toHaveBeenCalledWith('/auth/password', {
      currentPassword: 'old',
      newPassword: 'new-secret',
      confirmPassword: 'new-secret'
    })
  })

  it('confirmPasswordReset envia token e as duas senhas', async () => {
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

  it('toggle2FA e verify2FA usam os endpoints de segurança', async () => {
    await authAPI.toggle2FA(true)
    await authAPI.verify2FA('123456')

    expect(client.put).toHaveBeenCalledWith('/auth/security/2fa', { enabled: true })
    expect(client.post).toHaveBeenCalledWith('/auth/security/2fa/verify', { code: '123456' })
  })

  it('checkAuth e refreshToken batem nos endpoints de sessão', async () => {
    await authAPI.checkAuth()
    await authAPI.refreshToken()
    await authAPI.logout()

    expect(client.get).toHaveBeenCalledWith('/auth/me')
    expect(client.post).toHaveBeenCalledWith('/auth/refresh')
    expect(client.post).toHaveBeenCalledWith('/auth/logout')
  })
})
