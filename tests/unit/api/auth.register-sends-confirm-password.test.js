import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authAPI } from '@/api/auth'
import client from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

const authApiSource = readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8')
const cadastroSource = readFileSync(
  resolve(__dirname, '../../../src/components/Cadastro.vue'),
  'utf8'
)

describe('Auth — POST /auth/register envia confirmPassword em texto claro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('authAPI.register inclui password e confirmPassword no JSON; não omitiu a confirmação', async () => {
    const registerFn = authApiSource.slice(
      authApiSource.indexOf('register:'),
      authApiSource.indexOf('logout:')
    )

    expect(registerFn).toMatch(/client\.post\('\/auth\/register'/)
    expect(registerFn).toMatch(/password: userData\.password/)
    expect(registerFn).toMatch(/confirmPassword: userData\.confirmPassword/)
    expect(registerFn).not.toMatch(/delete .*\.confirmPassword|omit\(|hash/)

    client.post.mockResolvedValue({ data: { success: true } })

    await authAPI.register({
      name: 'Ana Lima',
      email: 'ana@exemplo.com',
      password: 'SenhaForte1!',
      confirmPassword: 'SenhaForte1!',
      phone: '(11) 99999-9999',
      acceptTerms: true,
      acceptMarketing: false
    })

    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.post).toHaveBeenCalledWith('/auth/register', expect.any(Object))

    const payload = client.post.mock.calls[0][1]
    expect(payload.password).toBe('SenhaForte1!')
    expect(payload.confirmPassword).toBe('SenhaForte1!')
    expect(payload).toHaveProperty('confirmPassword')
  })

  it('Cadastro.vue encaminha confirmPassword no authStore.register', () => {
    const handleRegister = cadastroSource.slice(
      cadastroSource.indexOf('const handleRegister'),
      cadastroSource.indexOf('const togglePassword')
    )

    expect(handleRegister).toMatch(/authStore\.register\(/)
    expect(handleRegister).toMatch(/confirmPassword: form\.value\.confirmPassword/)
    expect(handleRegister).toMatch(/password: form\.value\.password/)
  })
})
