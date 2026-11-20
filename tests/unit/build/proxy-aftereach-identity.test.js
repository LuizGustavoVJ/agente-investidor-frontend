import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())
const read = (rel) => readFileSync(resolve(root, rel), 'utf8')

describe('Contratos de router, proxy, identidade e boot', () => {
  it('afterEach só atualiza description se a meta tag já existir', () => {
    const src = read('src/router/index.js')
    expect(src).toContain("document.querySelector('meta[name=\"description\"]')")
    expect(src).not.toMatch(/createElement\(['\"]meta['\"]\)/)
    expect(src).toMatch(/if \(metaDescription\)/)
  })

  it('scrollBehavior devolve savedPosition ou { top: 0 }, nunca o hash', () => {
    const src = read('src/router/index.js')
    expect(src).toContain('if (savedPosition)')
    expect(src).toContain('return { top: 0 }')
    expect(src).not.toMatch(/to\.hash/)
  })

  it('rotas de metas, perfil setup e verificação de email não existem', () => {
    const src = read('src/router/index.js')
    expect(src).not.toMatch(/path:\s*['\"]\/metas/)
    expect(src).not.toMatch(/name:\s*['\"]EmailVerification['\"]/)
    expect(src).not.toMatch(/name:\s*['\"]ProfileSetup['\"]/)
    expect(src).not.toMatch(/path:\s*['\"]\/recuperar-senha['\"]/)
  })

  it('proxy de portfolio/brokers aponta para 8002 e rewrite é identidade', () => {
    const src = read('vite.config.js')
    expect(src).toMatch(/['\"]\/api\/portfolio['\"][\s\S]*target:\s*['\"]http:\/\/localhost:8002['\"]/)
    expect(src).toMatch(/['\"]\/api\/brokers['\"][\s\S]*target:\s*['\"]http:\/\/localhost:8002['\"]/)
    expect(src).toContain(String.raw`path.replace(/^\/api\/portfolio/, '/api/portfolio')`)
    expect(src).toContain("target: 'ws://localhost:8000'")
  })

  it('main.js não registra errorHandler global e toast some em 5s', () => {
    const src = read('src/main.js')
    expect(src).not.toMatch(/app\.config\.errorHandler/)
    expect(src).toMatch(/timeout:\s*5000/)
  })

  it('App.vue não envolve a árvore com Layout nem guarda de auth', () => {
    const src = read('src/App.vue')
    expect(src).toContain('<router-view />')
    expect(src).not.toMatch(/<Layout/)
    expect(src).not.toMatch(/requireAuth|isAuthenticated/)
  })

  it('Layout usa nome hardcoded Jane e logout não chama a store', () => {
    const src = read('src/components/Layout.vue')
    expect(src).toContain("nome: 'Jane'")
    expect(src).toContain("window.location.href = '/login'")
    expect(src).not.toMatch(/useAuthStore|sessionStorage/)
  })

  it('Footer legal aponta para # e o ano está congelado em 2025', () => {
    const src = read('src/components/Footer.vue')
    expect(src).toContain('href="#"')
    expect(src).toContain('© 2025 Agente Investidor')
    expect(src).not.toMatch(/to=['\"]\/termos['\"]/)
    expect(src).not.toMatch(/to=['\"]\/privacidade['\"]/)
  })

  it('index.html não declara meta description (afterEach fica no-op)', () => {
    const html = read('index.html')
    expect(html).not.toMatch(/<meta\s+name=["']description["']/)
    expect(html).toContain('lang="en"')
    expect(html).toContain('Vite + Vue')
  })

  it('Metas.vue não importa portfolioStore nem portfolioAPI', () => {
    const src = read('src/views/Metas.vue')
    expect(src).not.toMatch(/usePortfolioStore|portfolioAPI/)
    expect(src).toContain("await new Promise(resolve => setTimeout(resolve, 1000))")
  })
})
