import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const vite = readFileSync(resolve(__dirname, '../../../vite.config.js'), 'utf8')

describe('Vite — proxy /ws sem allowlist de origem', () => {
  it('expõe upgrade WebSocket para ws://localhost:8000 com host: true e sem checagem de Origin', () => {
    expect(vite).toMatch(/host:\s*true/)
    expect(vite).toMatch(/['"]\/ws['"]\s*:/)
    expect(vite).toMatch(/target:\s*['"]ws:\/\/localhost:8000['"]/)
    expect(vite).toMatch(/ws:\s*true/)
    expect(vite).toMatch(/changeOrigin:\s*true/)
  })

  it('o bloco /ws não tem configure, origin, allowedHosts nem verificação de Origin', () => {
    const wsBlock = vite.slice(vite.indexOf("'/ws'"), vite.indexOf('// Configuração de build'))

    expect(wsBlock).toMatch(/ws:\s*true/)
    expect(wsBlock).not.toMatch(/configure\s*:/)
    expect(wsBlock).not.toMatch(/allowedHosts/)
    expect(wsBlock).not.toMatch(/origin\s*:/)
    expect(wsBlock).not.toMatch(/headers\s*:/)
  })
})
