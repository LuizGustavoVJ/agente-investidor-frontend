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

describe('Auth API — toggle2FA desliga o fator sem código TOTP', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  it('PUT /auth/security/2fa manda só { enabled } — sem code, totp ou senha atual', async () => {
    const toggleStart = authApiSource.indexOf('toggle2FA:')
    const toggleFn = authApiSource.slice(
      toggleStart,
      authApiSource.indexOf('},', toggleStart) + 2
    )

    expect(toggleFn).toMatch(/\/auth\/security\/2fa/)
    expect(toggleFn).toMatch(/\{\s*enabled\s*\}/)
    expect(toggleFn).not.toMatch(/totp|currentPassword|twoFactorCode/)
    expect(toggleFn).not.toMatch(/code:/)

    client.put.mockResolvedValue({ data: { success: true } })

    await authAPI.toggle2FA(false)

    expect(client.put).toHaveBeenCalledTimes(1)
    expect(client.put).toHaveBeenCalledWith('/auth/security/2fa', { enabled: false })
    expect(client.put.mock.calls[0][1].code).toBeUndefined()
    expect(client.put.mock.calls[0][1].totp).toBeUndefined()
    expect(client.put.mock.calls[0][1].currentPassword).toBeUndefined()
  })

  it('verify2FA existe à parte e não entra no disable da Configuracoes', () => {
    expect(typeof authAPI.verify2FA).toBe('function')
    expect(authApiSource).toMatch(/\/auth\/security\/2fa\/verify/)

    expect(authStore.disable2FA).toBeUndefined()
    expect(authStore.toggle2FA).toBeUndefined()
    expect(authStore.verify2FA).toBeUndefined()
    expect(storeSource).not.toMatch(/toggle2FA|verify2FA|disable2FA/)

    const disableFn = settingsSource.slice(
      settingsSource.indexOf('const disable2FA = async'),
      settingsSource.indexOf('const terminateSession')
    )

    expect(disableFn).toMatch(/confirm\(/)
    expect(disableFn).toMatch(/authStore\.disable2FA\(\)/)
    expect(disableFn).not.toMatch(/totp|twoFactorCode|verify2FA|toggle2FA/)
    expect(settingsSource).not.toMatch(/v-model=".*totp|id="totp"|2fa-code/)
  })

  it('ativar 2FA também não pede QR nem verify2FA — só setup2FA inexistente', () => {
    const setupFn = settingsSource.slice(
      settingsSource.indexOf('const setup2FA = async'),
      settingsSource.indexOf('const disable2FA = async')
    )

    expect(setupFn).toMatch(/authStore\.setup2FA\(\)/)
    expect(setupFn).toMatch(/toast\.success\('2FA configurado com sucesso!'\)/)
    expect(setupFn).not.toMatch(/get2FAQRCode|verify2FA|toggle2FA|qr/)

    expect(authStore.setup2FA).toBeUndefined()
    expect(typeof authAPI.get2FAQRCode).toBe('function')
    expect(authAPI.setup2FA).toBeUndefined()
  })
})
