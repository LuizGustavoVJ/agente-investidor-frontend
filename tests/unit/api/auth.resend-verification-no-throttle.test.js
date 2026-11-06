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
const configSource = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)

describe('Auth API — resendVerificationEmail POST vazio sem throttle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('fonte da API não limita reenvio — sem debounce, cooldown, retry-after ou captcha', () => {
    const resendFn = authApiSource.slice(
      authApiSource.indexOf('resendVerificationEmail:'),
      authApiSource.indexOf('getSecuritySettings:')
    )

    expect(resendFn).toMatch(/client\.post\('\/auth\/email\/resend-verification'\)/)
    expect(resendFn).not.toMatch(/throttle|debounce|cooldown|Retry-After|setTimeout|Date\.now/)
    expect(resendFn).not.toMatch(/captcha|turnstile|recaptcha/)
    expect(resendFn).not.toMatch(/lastResend|rateLimit|\{ email/)
  })

  it('POST /auth/email/resend-verification sai sem body — cinco chamadas seguidas disparam cinco POSTs', async () => {
    await Promise.all([
      authAPI.resendVerificationEmail(),
      authAPI.resendVerificationEmail(),
      authAPI.resendVerificationEmail(),
      authAPI.resendVerificationEmail(),
      authAPI.resendVerificationEmail()
    ])

    expect(client.post).toHaveBeenCalledTimes(5)
    for (const call of client.post.mock.calls) {
      expect(call[0]).toBe('/auth/email/resend-verification')
      expect(call[1]).toBeUndefined()
      expect(call.length).toBe(1)
    }
  })

  it('Login, Cadastro e Configurações não expõem throttle de reenvio de verificação', () => {
    expect(loginSource).not.toMatch(/resendVerificationEmail|resend-verification/)
    expect(cadastroSource).not.toMatch(/resendVerificationEmail|resend-verification/)
    expect(configSource).not.toMatch(/resendVerificationEmail|resend-verification/)
  })
})
