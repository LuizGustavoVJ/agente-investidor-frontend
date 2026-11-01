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
    verifyEmail: vi.fn(),
    changePassword: vi.fn()
  }
}))

const authApiSource = readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8')
const storeSource = readFileSync(resolve(__dirname, '../../../src/stores/auth.js'), 'utf8')
const settingsSource = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)

describe('Auth — troca de e-mail via updateProfile sem senha nem reverify', () => {
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

  it('API não tem changeEmail; updateProfile encaminha o objeto inteiro', () => {
    const updateFn = authApiSource.slice(
      authApiSource.indexOf('updateProfile:'),
      authApiSource.indexOf('changePassword:')
    )

    expect(updateFn).toMatch(/client\.put\('\/auth\/profile',\s*profileData\)/)
    expect(authApiSource).not.toMatch(/changeEmail|\/auth\/email\/change/)
    expect(authAPI.changeEmail).toBeUndefined()

    expect(settingsSource).toMatch(/v-model="profileForm.email"/)
    expect(settingsSource).toMatch(/authStore\.updateProfile\(profileForm\.value\)/)

    const saveFn = settingsSource.slice(
      settingsSource.indexOf('const saveProfile = async'),
      settingsSource.indexOf('const saveInvestorProfile')
    )
    expect(saveFn).not.toMatch(/currentPassword|verifyEmail|changeEmail/)
    expect(storeSource).not.toMatch(/emailVerified/)
  })

  it('trocar o e-mail com perfil verificado mantém emailVerified true no merge raso', async () => {
    authStore.user = {
      id: 9,
      firstName: 'Ana',
      email: 'ana@exemplo.com',
      emailVerified: true
    }

    authAPI.updateProfile.mockResolvedValue({
      data: {
        success: true,
        user: { email: 'attacker@evil.com' }
      }
    })

    const result = await authStore.updateProfile({
      firstName: 'Ana',
      lastName: 'Lima',
      email: 'attacker@evil.com'
    })

    expect(result).toEqual({ success: true })
    expect(authAPI.updateProfile).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Lima',
      email: 'attacker@evil.com'
    })
    expect(authAPI.verifyEmail).not.toHaveBeenCalled()
    expect(authStore.user.email).toBe('attacker@evil.com')
    expect(authStore.user.emailVerified).toBe(true)
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(authStore.user)
    )
  })

  it('campos extras (role, permissions, twoFactorEnabled) passam no PUT sem whitelist', async () => {
    authStore.user = {
      id: 9,
      email: 'ana@exemplo.com',
      role: 'user',
      permissions: ['read']
    }

    const poisoned = {
      firstName: 'Ana',
      role: 'admin',
      permissions: ['*'],
      emailVerified: true,
      twoFactorEnabled: false
    }

    authAPI.updateProfile.mockResolvedValue({
      data: { success: true, user: poisoned }
    })

    await authStore.updateProfile(poisoned)

    expect(authAPI.updateProfile).toHaveBeenCalledWith(poisoned)
    expect(authStore.user.role).toBe('admin')
    expect(authStore.user.permissions).toEqual(['*'])
    expect(authStore.user.emailVerified).toBe(true)
    expect(authStore.user.twoFactorEnabled).toBe(false)
  })
})
