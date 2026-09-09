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
import { brokersAPI } from '@/api/brokers'

describe('Contratos de payload — campos descartados e IDs errados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: {} })
    client.post.mockResolvedValue({ data: {} })
    client.put.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
  })

  it('register descarta acceptMarketing enviado pelo cadastro', async () => {
    await authAPI.register({
      name: 'João',
      email: 'joao@email.com',
      password: 'Senha123',
      confirmPassword: 'Senha123',
      phone: '(11) 99999-9999',
      acceptTerms: true,
      acceptMarketing: true
    })

    expect(client.post).toHaveBeenCalledWith('/auth/register', {
      name: 'João',
      email: 'joao@email.com',
      password: 'Senha123',
      confirmPassword: 'Senha123',
      phone: '(11) 99999-9999',
      acceptTerms: true
    })
    expect(client.post.mock.calls[0][1]).not.toHaveProperty('acceptMarketing')
  })

  it('login descarta rememberMe enviado pelo formulário', async () => {
    await authAPI.login({
      email: 'user@email.com',
      password: 'senha123',
      rememberMe: true
    })

    expect(client.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@email.com',
      password: 'senha123'
    })
    expect(client.post.mock.calls[0][1]).not.toHaveProperty('rememberMe')
  })

  it('connectBroker com id string (como a view passa) envia brokerId undefined', async () => {
    await brokersAPI.connectBroker('xp')

    expect(client.post).toHaveBeenCalledWith('/brokers/connect', {
      brokerId: undefined,
      credentials: undefined,
      accountType: undefined
    })
  })
})
