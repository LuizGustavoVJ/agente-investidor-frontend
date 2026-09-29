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

describe('authAPI.login — rememberMe do checkbox é dropado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('POST /auth/login envia só email/senha; rememberMe:true some do body', async () => {
    await authAPI.login({
      email: 'joao@email.com',
      password: 'secret12',
      rememberMe: true
    })

    expect(client.post).toHaveBeenCalledWith('/auth/login', {
      email: 'joao@email.com',
      password: 'secret12'
    })
    const body = client.post.mock.calls[0][1]
    expect(body).not.toHaveProperty('rememberMe')
  })

  it('rememberMe:false também não vai no payload — sessão persistente não é configurável', async () => {
    await authAPI.login({
      email: 'joao@email.com',
      password: 'secret12',
      rememberMe: false
    })

    expect(client.post.mock.calls[0][1]).toEqual({
      email: 'joao@email.com',
      password: 'secret12'
    })
  })
})
