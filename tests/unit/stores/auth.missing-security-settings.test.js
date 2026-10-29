import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn(),
    getSecuritySettings: vi.fn()
  }
}))

const configuracoesSource = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)
const storeSource = readFileSync(
  resolve(__dirname, '../../../src/stores/auth.js'),
  'utf8'
)
const authApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/auth.js'),
  'utf8'
)

const userWithoutSecurity = {
  id: 9,
  name: 'Ana Lima',
  email: 'ana@exemplo.com',
  twoFactorEnabled: false
}

describe('Auth — GET /auth/security existe e nunca hidrata sessões nem 2FA', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.setItem.mockReset()
    sessionStorage.removeItem.mockReset()
    sessionStorage.getItem.mockReturnValue(null)
  })

  it('API tem getSecuritySettings; store e Configuracoes nunca chamam', () => {
    expect(authApiSource).toMatch(/getSecuritySettings/)
    expect(authApiSource).toMatch(/\/auth\/security/)
    expect(typeof authAPI.getSecuritySettings).toBe('function')

    expect(authStore.getSecuritySettings).toBeUndefined()
    expect(authStore.fetchSecuritySettings).toBeUndefined()
    expect(authStore.activeSessions).toBeUndefined()
    expect(storeSource).not.toMatch(/getSecuritySettings/)
    expect(storeSource).not.toMatch(/activeSessions/)

    expect(configuracoesSource).toMatch(/authStore\.loadUserSettings\(\)/)
    expect(configuracoesSource).not.toMatch(/getSecuritySettings/)
    expect(configuracoesSource).toMatch(/authStore\.activeSessions \|\| \[\]/)
    expect(configuracoesSource).toMatch(/user\.twoFactorEnabled/)
  })

  it('login sucesso não chama getSecuritySettings — sessões ficam vazias e 2FA só no user', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, user: userWithoutSecurity }
    })

    const result = await authStore.login({
      email: userWithoutSecurity.email,
      password: 'senha-forte'
    })

    expect(result).toEqual({ success: true })
    expect(authStore.user).toEqual(userWithoutSecurity)
    expect(authStore.user.twoFactorEnabled).toBe(false)
    expect(authStore.activeSessions).toBeUndefined()
    expect(authAPI.getSecuritySettings).not.toHaveBeenCalled()
  })

  it('checkAuthStatus hidrata o user e não busca /auth/security — lista de sessões continua inexistente', async () => {
    authAPI.checkAuth.mockResolvedValue({
      data: { success: true, user: userWithoutSecurity }
    })

    const ok = await authStore.checkAuthStatus()

    expect(ok).toBe(true)
    expect(authStore.user.email).toBe('ana@exemplo.com')
    expect(authAPI.getSecuritySettings).not.toHaveBeenCalled()
    expect(authStore.activeSessions).toBeUndefined()
    expect(authStore.getSecuritySettings).toBeUndefined()
  })
})
