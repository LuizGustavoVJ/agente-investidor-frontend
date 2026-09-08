import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const readSrc = (relativePath) =>
  readFileSync(resolve(__dirname, '../../../src', relativePath), 'utf8')

const routerSource = readSrc('router/index.js')
const dashboardSource = readSrc('components/Dashboard.vue')
const loginSource = readSrc('components/Login.vue')
const corretorasSource = readSrc('views/Corretoras.vue')
const metasSource = readSrc('views/Metas.vue')

describe('Router — destinos usados pela UI', () => {
  it('restaura posição salva no scroll e vai ao topo no restante', () => {
    expect(routerSource).toContain('if (savedPosition)')
    expect(routerSource).toContain('return savedPosition')
    expect(routerSource).toContain('return { top: 0 }')
  })

  it('Dashboard cria meta em /metas, mas o router não registra essa rota', () => {
    expect(dashboardSource).toContain("router.push('/metas')")
    expect(routerSource).not.toContain("path: '/metas'")
    expect(routerSource).not.toContain("name: 'Metas'")
  })

  it('Login oferece /recuperar-senha, mas o router não registra a rota', () => {
    expect(loginSource).toContain('to="/recuperar-senha"')
    expect(routerSource).not.toContain("path: '/recuperar-senha'")
  })

  it('Corretoras navega para detalhe e configuração que não existem no router', () => {
    expect(corretorasSource).toContain('router.push(`/corretoras/${broker.id}`)')
    expect(corretorasSource).toContain('router.push(`/corretoras/${broker.id}/configuracao`)')
    expect(routerSource).not.toContain("path: '/corretoras/:id'")
    expect(routerSource).not.toContain("path: '/corretoras/:id/configuracao'")
  })

  it('Metas abre detalhe em /metas/:id, rota também ausente', () => {
    expect(metasSource).toContain('router.push(`/metas/${goal.id}`)')
    expect(routerSource).not.toContain("path: '/metas/:id'")
  })

  it('rotas aninhadas de corretora cairiam no catch-all público, sem requireAuth', () => {
    const catchAll = routerSource.split("path: '/:pathMatch(.*)*'")[1]?.slice(0, 350)

    expect(catchAll).toContain("name: 'Error404'")
    expect(catchAll).toContain('public: true')
    expect(catchAll).not.toContain('requireAuth')
    expect(catchAll).not.toContain('requiresAuth: true')
  })
})
