import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const routerSrc = readFileSync(
  resolve(__dirname, '../../../src/router/index.js'),
  'utf8'
)

describe('Contratos do router (parse do fonte — não importar @/router)', () => {
  it('aponta para views lazy que não existem no repositório', () => {
    const missing = [
      'src/views/Portfolio.vue',
      'src/views/Analises.vue',
      'src/views/Metodologias.vue',
      'src/views/Relatorios.vue',
      'src/views/Perfil.vue',
      'src/views/Ajuda.vue',
      'src/views/Sobre.vue',
      'src/views/Termos.vue',
      'src/views/Privacidade.vue',
      'src/views/Maintenance.vue',
      'src/views/Forbidden.vue'
    ]

    for (const file of missing) {
      expect(existsSync(resolve(__dirname, '../../../', file)), file).toBe(false)
      const basename = file.split('/').pop().replace('.vue', '')
      expect(routerSrc).toContain(`@/views/${basename}.vue`)
    }
  })

  it('não registra /metas, /metas/:id, /recuperar-senha nem /corretoras/:id', () => {
    expect(routerSrc).not.toMatch(/path:\s*['"]\/metas['"]/)
    expect(routerSrc).not.toMatch(/path:\s*['"]\/metas\//)
    expect(routerSrc).not.toMatch(/path:\s*['"]\/recuperar-senha['"]/)
    expect(routerSrc).not.toMatch(/path:\s*['"]\/corretoras\//)
    expect(routerSrc).not.toContain("name: 'EmailVerification'")
    expect(routerSrc).not.toContain("name: 'ProfileSetup'")
    expect(routerSrc).not.toContain("name: 'Metas'")
  })

  it('ChunkLoadError recarrega a página; qualquer outro erro vai para /500', () => {
    expect(routerSrc).toMatch(/error\.name === 'ChunkLoadError'/)
    expect(routerSrc).toMatch(/window\.location\.reload\(\)/)
    expect(routerSrc).toMatch(/router\.push\('\/500'\)/)
  })

  it('afterEach grava document.title a partir de meta.title', () => {
    expect(routerSrc).toMatch(/document\.title = to\.meta\.title/)
    expect(routerSrc).toMatch(/meta\[name="description"\]/)
  })

  it('scrollBehavior devolve savedPosition ou { top: 0 }', () => {
    expect(routerSrc).toMatch(/if \(savedPosition\)/)
    expect(routerSrc).toMatch(/return \{ top: 0 \}/)
  })

  it('rotas autenticadas usam requireAuth; login/cadastro usam requireGuest', () => {
    expect(routerSrc).toMatch(/path:\s*'\/dashboard'[\s\S]*?beforeEnter:\s*requireAuth/)
    expect(routerSrc).toMatch(/path:\s*'\/login'[\s\S]*?beforeEnter:\s*requireGuest/)
    expect(routerSrc).toMatch(/path:\s*'\/cadastro'[\s\S]*?beforeEnter:\s*requireGuest/)
  })

  it('views que existem de fato são Corretoras, Configuracoes e Metas — Metas fora do router', () => {
    expect(existsSync(resolve(__dirname, '../../../src/views/Corretoras.vue'))).toBe(true)
    expect(existsSync(resolve(__dirname, '../../../src/views/Configuracoes.vue'))).toBe(true)
    expect(existsSync(resolve(__dirname, '../../../src/views/Metas.vue'))).toBe(true)
    expect(routerSrc).toContain('@/views/Corretoras.vue')
    expect(routerSrc).toContain('@/views/Configuracoes.vue')
    expect(routerSrc).not.toContain('@/views/Metas.vue')
  })
})
