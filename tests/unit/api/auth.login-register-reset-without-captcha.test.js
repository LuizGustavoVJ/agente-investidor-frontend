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
const loginSource = readFileSync(
  resolve(__dirname, '../../../src/components/Login.vue'),
  'utf8'
)
const cadastroSource = readFileSync(
  resolve(__dirname, '../../../src/components/Cadastro.vue'),
  'utf8'
)

describe('Auth API — login, cadastro e reset saem sem captcha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('fonte da API e dos formulários não menciona captcha, turnstile nem recaptcha', () => {
    expect(authApiSource).not.toMatch(/captcha|turnstile|recaptcha|hcaptcha|cf-turnstile/i)
    expect(loginSource).not.toMatch(/captcha|turnstile|recaptcha|hcaptcha|vue-recaptcha/i)
    expect(cadastroSource).not.toMatch(/captcha|turnstile|recaptcha|hcaptcha|vue-recaptcha/i)
  })

  it('POST /auth/login, /auth/register e /auth/password/reset-request não enviam desafio', async () => {
    await authAPI.login({
      email: 'ana@exemplo.com',
      password: 'Segredo1!',
      captchaToken: 'should-be-dropped'
    })
    await authAPI.register({
      name: 'Ana',
      email: 'ana@exemplo.com',
      password: 'Segredo1!',
      confirmPassword: 'Segredo1!',
      phone: '(11) 99999-9999',
      acceptTerms: true,
      captchaToken: 'should-be-dropped'
    })
    await authAPI.requestPasswordReset('ana@exemplo.com')

    expect(client.post).toHaveBeenCalledTimes(3)

    const loginBody = client.post.mock.calls[0][1]
    expect(client.post.mock.calls[0][0]).toBe('/auth/login')
    expect(loginBody).toEqual({ email: 'ana@exemplo.com', password: 'Segredo1!' })
    expect(loginBody.captchaToken).toBeUndefined()
    expect(loginBody.token).toBeUndefined()

    const registerBody = client.post.mock.calls[1][1]
    expect(client.post.mock.calls[1][0]).toBe('/auth/register')
    expect(registerBody.captchaToken).toBeUndefined()
    expect(registerBody.email).toBe('ana@exemplo.com')

    const resetBody = client.post.mock.calls[2][1]
    expect(client.post.mock.calls[2][0]).toBe('/auth/password/reset-request')
    expect(resetBody).toEqual({ email: 'ana@exemplo.com' })
    expect(resetBody.captchaToken).toBeUndefined()
  })
})
