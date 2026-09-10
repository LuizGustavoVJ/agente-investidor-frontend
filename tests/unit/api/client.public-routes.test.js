import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')

describe('Client Axios — rotas públicas no 401', () => {
  const publicRoutesMatch = clientSource.match(
    /const publicRoutes = \[([^\]]+)\]/
  )

  it('lista apenas /, /login e /cadastro como públicas após 401', () => {
    expect(publicRoutesMatch).not.toBeNull()
    expect(publicRoutesMatch[1]).toContain("'/'")
    expect(publicRoutesMatch[1]).toContain("'/login'")
    expect(publicRoutesMatch[1]).toContain("'/cadastro'")
  })

  it('páginas públicas de auth, legal e ajuda não estão na allowlist do 401', () => {
    const list = publicRoutesMatch[1]

    expect(list).not.toContain('/recuperar-senha')
    expect(list).not.toContain('/termos')
    expect(list).not.toContain('/privacidade')
    expect(list).not.toContain('/ajuda')
    expect(list).not.toContain('/sobre')
    expect(list).not.toContain('/manutencao')
    expect(list).not.toContain('/403')
  })

  it('401 dispara logout + redirect fora da allowlist', () => {
    expect(clientSource).toContain('await authStore.logout()')
    expect(clientSource).toContain("window.location.href = '/login'")
  })
})
