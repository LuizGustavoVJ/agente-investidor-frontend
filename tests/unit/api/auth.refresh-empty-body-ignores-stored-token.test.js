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
const storeSource = readFileSync(resolve(__dirname, '../../../src/stores/auth.js'), 'utf8')
const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')

describe('Auth — POST /auth/refresh vai sem body e ignora refreshToken da sessão', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.getItem.mockReset()
    sessionStorage.getItem.mockReturnValue(
      JSON.stringify({
        id: 9,
        email: 'ana@exemplo.com',
        token: 'jwt-access-stored',
        refreshToken: 'jwt-refresh-stored'
      })
    )
  })

  it('authAPI.refreshToken POST /auth/refresh sem body, headers ou refreshToken', async () => {
    const refreshFn = authApiSource.slice(
      authApiSource.indexOf('refreshToken:'),
      authApiSource.indexOf('updateProfile:')
    )
    expect(refreshFn).toMatch(/client\.post\('\/auth\/refresh'\)/)
    expect(refreshFn).not.toMatch(/Authorization|sessionStorage/)
    expect(refreshFn).not.toMatch(/client\.post\('\/auth\/refresh',\s*/)

    client.post.mockResolvedValue({ data: { success: true, accessToken: 'jwt-novo' } })

    await authAPI.refreshToken()

    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.post).toHaveBeenCalledWith('/auth/refresh')
    expect(client.post.mock.calls[0][1]).toBeUndefined()
    expect(sessionStorage.getItem).not.toHaveBeenCalled()
  })

  it('interceptor 401 também posta /auth/refresh vazio e a store não lê o token persistido', () => {
    const responseInterceptor = clientSource.slice(
      clientSource.indexOf('client.interceptors.response.use'),
      clientSource.indexOf('// Função para configurar base URL')
    )
    expect(responseInterceptor).toMatch(/client\.post\('\/auth\/refresh'\)/)
    expect(responseInterceptor).not.toMatch(
      /client\.post\('\/auth\/refresh',\s*\{/
    )
    expect(responseInterceptor).not.toMatch(/sessionStorage|refreshToken|setAuthHeader/)

    expect(storeSource).not.toMatch(/authAPI\.refreshToken|refreshToken\s*\(/)
    expect(storeSource).not.toMatch(/sessionStorage\.getItem\('refreshToken'\)/)
    expect(typeof authAPI.refreshToken).toBe('function')
  })
})
