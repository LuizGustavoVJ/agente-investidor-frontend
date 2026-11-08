import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const viteSource = readFileSync(
  resolve(__dirname, '../../../vite.config.js'),
  'utf8'
)

const serverBlock = viteSource.slice(
  viteSource.indexOf('server:'),
  viteSource.indexOf('// Configuração de build')
)

describe('Vite — server/preview sem cabeçalhos HTTP de segurança', () => {
  it('server não declara headers — COOP, nosniff e X-Frame-Options não saem no dev', () => {
    expect(serverBlock).toMatch(/port:\s*3000/)
    expect(serverBlock).toMatch(/proxy:/)
    expect(serverBlock).not.toMatch(/headers\s*:/)

    expect(viteSource).not.toMatch(/X-Content-Type-Options/)
    expect(viteSource).not.toMatch(/nosniff/)
    expect(viteSource).not.toMatch(/X-Frame-Options/)
    expect(viteSource).not.toMatch(/Cross-Origin-Opener-Policy/)
    expect(viteSource).not.toMatch(/Cross-Origin-Resource-Policy/)
    expect(viteSource).not.toMatch(/Content-Security-Policy/)
  })

  it('não há bloco preview — vite preview também não envia COOP/nosniff', () => {
    expect(viteSource).not.toMatch(/preview\s*:/)
    expect(viteSource).not.toMatch(/preview\.headers/)
  })
})
