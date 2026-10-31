import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'

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

describe('Auth API — ciclo de vida da conta não existe no cliente HTTP', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  it('authAPI não expõe deleteAccount, exportUserData, terminateSession nem getSessions', () => {
    expect(authAPI.deleteAccount).toBeUndefined()
    expect(authAPI.exportUserData).toBeUndefined()
    expect(authAPI.terminateSession).toBeUndefined()
    expect(authAPI.getSessions).toBeUndefined()
    expect(authAPI.revokeAllSessions).toBeUndefined()

    expect(authApiSource).not.toMatch(/\/auth\/account/)
    expect(authApiSource).not.toMatch(/\/auth\/export/)
    expect(authApiSource).not.toMatch(/\/auth\/sessions/)
    expect(authApiSource).not.toMatch(/deleteAccount|exportUserData|terminateSession/)
  })

  it('store também não expõe as actions — Configuracoes chama as três mesmo assim', () => {
    expect(authStore.deleteAccount).toBeUndefined()
    expect(authStore.exportUserData).toBeUndefined()
    expect(authStore.terminateSession).toBeUndefined()
    expect(authStore.activeSessions).toBeUndefined()

    expect(storeSource).not.toMatch(/deleteAccount|exportUserData|terminateSession|activeSessions/)

    expect(settingsSource).toMatch(/authStore\.deleteAccount\(/)
    expect(settingsSource).toMatch(/authStore\.exportUserData\(/)
    expect(settingsSource).toMatch(/authStore\.terminateSession\(session\.id\)/)
    expect(settingsSource).toMatch(/authStore\.activeSessions/)
  })

  it('exclusão toasta sucesso e navega para / mesmo sem endpoint — só o botão exige EXCLUIR', () => {
    const deleteFn = settingsSource.slice(
      settingsSource.indexOf('const deleteAccount = async'),
      settingsSource.indexOf('const closeDeleteModal')
    )

    expect(deleteFn).toMatch(/await authStore\.deleteAccount\(\)/)
    expect(deleteFn).toMatch(/toast\.success\('Conta excluída com sucesso'\)/)
    expect(deleteFn).toMatch(/router\.push\('\/'\)/)
    expect(deleteFn).not.toMatch(/deleteConfirmation/)
    expect(deleteFn).not.toMatch(/authAPI/)

    expect(settingsSource).toMatch(/deleteConfirmation !== 'EXCLUIR'/)
    expect(settingsSource).not.toMatch(/\/auth\/account/)
  })
})
