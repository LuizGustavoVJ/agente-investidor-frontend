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
const routerSource = readFileSync(resolve(__dirname, '../../../src/router/index.js'), 'utf8')

describe('Auth — POST /auth/password/reset-confirm envia token e confirmPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.post.mockResolvedValue({ data: { success: true } })
  })

  it('confirmPasswordReset manda token, newPassword e confirmPassword no JSON; não há rota de reset', async () => {
    const confirmFn = authApiSource.slice(
      authApiSource.indexOf('confirmPasswordReset:'),
      authApiSource.indexOf('verifyEmail:')
    )

    expect(confirmFn).toMatch(/client\.post\('\/auth\/password\/reset-confirm'/)
    expect(confirmFn).toMatch(/token: resetData\.token/)
    expect(confirmFn).toMatch(/newPassword: resetData\.newPassword/)
    expect(confirmFn).toMatch(/confirmPassword: resetData\.confirmPassword/)
    expect(confirmFn).not.toMatch(/delete .*\.confirmPassword|omit\(|hash/)

    await authAPI.confirmPasswordReset({
      token: 'reset-token-abc',
      newPassword: 'NovaSenha1!',
      confirmPassword: 'NovaSenha1!'
    })

    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.post).toHaveBeenCalledWith(
      '/auth/password/reset-confirm',
      expect.any(Object)
    )

    const payload = client.post.mock.calls[0][1]
    expect(payload.token).toBe('reset-token-abc')
    expect(payload.newPassword).toBe('NovaSenha1!')
    expect(payload.confirmPassword).toBe('NovaSenha1!')
    expect(payload).toHaveProperty('confirmPassword')

    expect(routerSource).not.toMatch(/recuperar-senha|redefinir-senha|password\/reset/)
  })

  it('requestPasswordReset só manda email cru — sem trim nem validação no client', async () => {
    const requestFn = authApiSource.slice(
      authApiSource.indexOf('requestPasswordReset:'),
      authApiSource.indexOf('confirmPasswordReset:')
    )

    expect(requestFn).toMatch(/client\.post\('\/auth\/password\/reset-request'/)
    expect(requestFn).toMatch(/\{\s*email\s*\}/)
    expect(requestFn).not.toMatch(/trim\(|toLowerCase\(|includes\('@'\)/)

    await authAPI.requestPasswordReset('  ANA@Exemplo.com  ')

    expect(client.post).toHaveBeenCalledWith('/auth/password/reset-request', {
      email: '  ANA@Exemplo.com  '
    })
  })
})
