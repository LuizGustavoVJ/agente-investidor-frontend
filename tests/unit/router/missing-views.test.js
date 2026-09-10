import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(__dirname, '../../..')
const routerSource = readFileSync(resolve(root, 'src/router/index.js'), 'utf8')
const cadastroSource = readFileSync(resolve(root, 'src/components/Cadastro.vue'), 'utf8')
const loginSource = readFileSync(resolve(root, 'src/components/Login.vue'), 'utf8')
const dashboardSource = readFileSync(resolve(root, 'src/components/Dashboard.vue'), 'utf8')

const lazyViews = [...routerSource.matchAll(/import\('@\/views\/([^']+)'\)/g)].map(
  (match) => match[1]
)

describe('Router — views e rotas referenciadas pela UI', () => {
  it('lazy-load aponta para arquivos que não existem no disco', () => {
    const missing = lazyViews.filter(
      (file) => !existsSync(resolve(root, 'src/views', file))
    )

    expect(missing).toEqual(
      expect.arrayContaining([
        'Portfolio.vue',
        'Analises.vue',
        'Metodologias.vue',
        'Relatorios.vue',
        'Perfil.vue',
        'Ajuda.vue',
        'Sobre.vue',
        'Termos.vue',
        'Privacidade.vue',
        'Maintenance.vue',
        'Forbidden.vue'
      ])
    )
    expect(missing).not.toContain('Corretoras.vue')
    expect(missing).not.toContain('Configuracoes.vue')
  })

  it('Metas.vue existe, mas /metas não está no router', () => {
    expect(existsSync(resolve(root, 'src/views/Metas.vue'))).toBe(true)
    expect(routerSource).not.toMatch(/path:\s*'\/metas'/)
    expect(dashboardSource).toContain("router.push('/metas')")
    expect(dashboardSource).toContain('to="/metas"')
  })

  it('Login e Cadastro navegam para rotas sem componente válido', () => {
    expect(loginSource).toContain('to="/recuperar-senha"')
    expect(routerSource).not.toMatch(/path:\s*'\/recuperar-senha'/)

    expect(cadastroSource).toContain('to="/termos"')
    expect(cadastroSource).toContain('to="/privacidade"')
    expect(lazyViews).toContain('Termos.vue')
    expect(lazyViews).toContain('Privacidade.vue')
    expect(existsSync(resolve(root, 'src/views/Termos.vue'))).toBe(false)
    expect(existsSync(resolve(root, 'src/views/Privacidade.vue'))).toBe(false)
  })
})
