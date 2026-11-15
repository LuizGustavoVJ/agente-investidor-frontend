import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const mainSource = readFileSync(resolve(__dirname, '../../src/main.js'), 'utf8')
const routerSource = readFileSync(resolve(__dirname, '../../src/router/index.js'), 'utf8')

describe('main.js — boot não hidrata a sessão', () => {
  it('monta Pinia e o router sem chamar initialize/checkAuthStatus', () => {
    expect(mainSource).toMatch(/app\.use\(pinia\)/)
    expect(mainSource).toMatch(/app\.use\(router\)/)
    expect(mainSource).toMatch(/app\.mount\('#app'\)/)
    expect(mainSource).not.toMatch(/useAuthStore|initialize|checkAuthStatus/)
  })

  it('Home pública não tem beforeEnter — sessionStorage user só é conferido ao entrar numa rota com requireAuth', () => {
    const home = routerSource.slice(
      routerSource.indexOf("path: '/'"),
      routerSource.indexOf("path: '/login'")
    )

    expect(home).toMatch(/name:\s*'Home'/)
    expect(home).toMatch(/public:\s*true/)
    expect(home).not.toMatch(/beforeEnter/)
    expect(home).not.toMatch(/requireAuth|initialize/)

    expect(routerSource).toMatch(/beforeEnter:\s*requireAuth/)
    expect(routerSource).toMatch(/path:\s*'\/dashboard'/)
  })
})
