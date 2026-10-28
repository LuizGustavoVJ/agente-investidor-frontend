import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import client from '@/api/client'
import { authAPI } from '@/api/auth'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

const authApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/auth.js'),
  'utf8'
)

describe('API auth — login descarta o código 2FA e verify2FA nunca entra no POST /auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('login com totp/code/twoFactorCode manda só email e senha', () => {
    authAPI.login({
      email: 'ana@exemplo.com',
      password: 'senha-forte',
      totp: '123456',
      code: '123456',
      twoFactorCode: '123456',
      rememberMe: true
    })

    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.post).toHaveBeenCalledWith('/auth/login', {
      email: 'ana@exemplo.com',
      password: 'senha-forte'
    })
    const payload = client.post.mock.calls[0][1]
    expect(payload).not.toHaveProperty('totp')
    expect(payload).not.toHaveProperty('code')
    expect(payload).not.toHaveProperty('twoFactorCode')
    expect(payload).not.toHaveProperty('rememberMe')
  })

  it('verify2FA existe como POST /auth/security/2fa/verify e não é chamado no login', () => {
    expect(authApiSource).toMatch(/verify2FA/)
    expect(authApiSource).toMatch(/\/auth\/security\/2fa\/verify/)
    expect(typeof authAPI.verify2FA).toBe('function')

    authAPI.login({
      email: 'ana@exemplo.com',
      password: 'senha-forte',
      totp: '654321'
    })

    const urls = client.post.mock.calls.map((call) => call[0])
    expect(urls).toEqual(['/auth/login'])
    expect(urls).not.toContain('/auth/security/2fa/verify')
  })
})
