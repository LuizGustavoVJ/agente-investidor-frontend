import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const viteSource = readFileSync(resolve(__dirname, '../../../vite.config.js'), 'utf8')

describe('Vite — dev server aberto na rede com CORS e proxy sem allowlist', () => {
  it('server.host true e cors true — a origem do SPA/proxy não é restringida', () => {
    const serverBlock = viteSource.slice(
      viteSource.indexOf('server: {'),
      viteSource.indexOf('// Configuração de build')
    )

    expect(serverBlock).toMatch(/host:\s*true/)
    expect(serverBlock).toMatch(/cors:\s*true/)
    expect(serverBlock).not.toMatch(/cors:\s*false/)
    expect(serverBlock).not.toMatch(/origin:\s*\[/)
    expect(serverBlock).not.toMatch(/allowedHosts/)
  })

  it('proxy de /api/auth e /api/portfolio aponta para localhost com secure:false e changeOrigin', () => {
    const serverBlock = viteSource.slice(
      viteSource.indexOf('server: {'),
      viteSource.indexOf('// Configuração de build')
    )

    expect(serverBlock).toMatch(/'\/api\/auth'/)
    expect(serverBlock).toMatch(/'\/api\/portfolio'/)
    expect(serverBlock).toMatch(/target:\s*'http:\/\/localhost:8001'/)
    expect(serverBlock).toMatch(/changeOrigin:\s*true/)
    expect(serverBlock).toMatch(/secure:\s*false/)
    expect(serverBlock).not.toMatch(/configure\s*\(/)
    expect(serverBlock).not.toMatch(/cookieDomainRewrite|bypass|origin.*allowlist/)
  })
})
