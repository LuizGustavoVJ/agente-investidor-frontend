import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
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
const storeSource = readFileSync(resolve(__dirname, '../../../src/stores/auth.js'), 'utf8')
const settingsSource = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)

describe('Auth API — changePassword não revoga sessões nem pede 2FA', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  it('PUT /auth/password manda só current/new/confirm — totp e revoke caem fora', async () => {
    const changeFn = authApiSource.slice(
      authApiSource.indexOf('changePassword:'),
      authApiSource.indexOf('requestPasswordReset:')
    )

    expect(changeFn).toMatch(/\/auth\/password/)
    expect(changeFn).toMatch(/currentPassword/)
    expect(changeFn).toMatch(/newPassword/)
    expect(changeFn).toMatch(/confirmPassword/)
    expect(changeFn).not.toMatch(/totp|twoFactor|code|revoke|logoutAll|sessions/)

    expect(authAPI.logoutAll).toBeUndefined()
    expect(authAPI.revokeAllSessions).toBeUndefined()
    expect(authAPI.terminateSession).toBeUndefined()
    expect(authApiSource).not.toMatch(/\/auth\/sessions|logoutAll|revokeAll/)

    client.put.mockResolvedValue({ data: { success: true } })

    await authAPI.changePassword({
      currentPassword: 'antiga',
      newPassword: 'nova-senha-forte',
      confirmPassword: 'nova-senha-forte',
      totp: '123456',
      revokeOtherSessions: true
    })

    expect(client.put).toHaveBeenCalledWith('/auth/password', {
      currentPassword: 'antiga',
      newPassword: 'nova-senha-forte',
      confirmPassword: 'nova-senha-forte'
    })
  })

  it('Configuracoes altera senha sem encerrar sessões e sem código 2FA', () => {
    const changeUi = settingsSource.slice(
      settingsSource.indexOf('const changePassword = async'),
      settingsSource.indexOf('const setup2FA')
    )

    expect(changeUi).toMatch(/authStore\.changePassword\(/)
    expect(changeUi).toMatch(/toast\.success\('Senha alterada com sucesso!'\)/)
    expect(changeUi).not.toMatch(/totp|twoFactor|verify2FA/)
    expect(changeUi).not.toMatch(/logout|terminateSession|revoke/)

    expect(authStore.changePassword).toBeUndefined()
    expect(authStore.logoutAll).toBeUndefined()
    expect(authStore.terminateSession).toBeUndefined()
    expect(storeSource).not.toMatch(/changePassword|logoutAll|revokeAllSessions/)
  })
})
