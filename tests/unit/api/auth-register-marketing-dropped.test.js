import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import client from '@/api/client'
import { authAPI } from '@/api/auth'

describe('authAPI.register — consentimento de marketing some do POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('Cadastro envia acceptMarketing:true e o body da API não leva o campo', async () => {
    await authAPI.register({
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'secret12',
      confirmPassword: 'secret12',
      phone: '(11) 99999-9999',
      acceptTerms: true,
      acceptMarketing: true
    })

    expect(client.post).toHaveBeenCalledWith('/auth/register', {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'secret12',
      confirmPassword: 'secret12',
      phone: '(11) 99999-9999',
      acceptTerms: true
    })

    const body = client.post.mock.calls[0][1]
    expect(body).not.toHaveProperty('acceptMarketing')
  })

  it('acceptMarketing:false também some — opt-out e opt-in são indistinguíveis no backend', async () => {
    await authAPI.register({
      name: 'Maria',
      email: 'maria@email.com',
      password: 'secret12',
      confirmPassword: 'secret12',
      phone: '',
      acceptTerms: true,
      acceptMarketing: false
    })

    const body = client.post.mock.calls[0][1]
    expect(body.acceptTerms).toBe(true)
    expect(body).not.toHaveProperty('acceptMarketing')
  })
})
