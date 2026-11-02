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
    updateProfile: vi.fn()
  }
}))

const storeSource = readFileSync(resolve(__dirname, '../../../src/stores/auth.js'), 'utf8')
const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const srcFiles = [
  storeSource,
  clientSource,
  readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8'),
  readFileSync(resolve(__dirname, '../../../src/main.js'), 'utf8')
].join('\n')

describe('Auth — logout não apaga cookie legível e js-cookie não é usado', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    sessionStorage.removeItem.mockReset()
    window.location.pathname = '/'
    window.location.href = 'http://localhost:3000/'
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('src não importa js-cookie e logout só remove sessionStorage.user', () => {
    expect(srcFiles).not.toMatch(/js-cookie|from 'js-cookie'|from "js-cookie"/)
    expect(storeSource).not.toMatch(/document\.cookie|Cookies\.(remove|get|set)/)
    expect(clientSource).not.toMatch(/document\.cookie|Cookies\.(remove|get|set)/)

    const logoutFn = storeSource.slice(
      storeSource.indexOf('const logout = async'),
      storeSource.indexOf('const checkAuthStatus')
    )
    expect(logoutFn).toMatch(/sessionStorage\.removeItem\('user'\)/)
    expect(logoutFn).not.toMatch(/document\.cookie|Cookies\.remove/)
  })

  it('cookie não-HttpOnly sobrevive ao logout local', async () => {
    authStore.user = {
      id: 9,
      email: 'ana@exemplo.com',
      token: 'jwt-readable-session'
    }
    document.cookie = 'token=jwt-readable-session; path=/'
    document.cookie = 'refreshToken=jwt-refresh-readable; path=/'
    authAPI.logout.mockResolvedValue({ data: { success: true } })

    await authStore.logout()

    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
    expect(document.cookie).toContain('token=jwt-readable-session')
    expect(document.cookie).toContain('refreshToken=jwt-refresh-readable')
    expect(window.location.href).toBe('http://localhost:3000/')
  })
})
