import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const routerSource = readFileSync(resolve(root, 'src/router/index.js'), 'utf8')
const viteSource = readFileSync(resolve(root, 'vite.config.js'), 'utf8')

describe('Router — createWebHistory sem BASE_URL', () => {
  it('createWebHistory() é chamado sem import.meta.env.BASE_URL', () => {
    expect(routerSource).toMatch(/createWebHistory\s*\(\s*\)/)
    expect(routerSource).not.toMatch(/createWebHistory\s*\(\s*import\.meta\.env\.BASE_URL/)
  })

  it('vite.config não declara base — assets e /login assumem a raiz do host', () => {
    expect(viteSource).not.toMatch(/^\s*base\s*:/m)
    expect(viteSource).not.toMatch(/base:\s*import\.meta\.env\.BASE_URL/)
  })

  it('rotas de auth usam path absoluto /login e /cadastro — subpath quebra o deep link', () => {
    expect(routerSource).toMatch(/path:\s*['"]\/login['"]/)
    expect(routerSource).toMatch(/path:\s*['"]\/cadastro['"]/)
    expect(routerSource).toMatch(/path:\s*['"]\/dashboard['"]/)
  })
})
