import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createRouter, createMemoryHistory } from 'vue-router'

const routerSource = readFileSync(resolve(__dirname, '../../../src/router/index.js'), 'utf8')

const productionPaths = [...routerSource.matchAll(/path:\s*'([^']+)'/g)].map(
  (match) => match[1]
)

const stub = { template: '<div />' }

const productionRoutes = productionPaths.map((path) => ({
  path,
  name: path === '/:pathMatch(.*)*' ? 'Error404' : path,
  component: stub,
  meta:
    path === '/:pathMatch(.*)*'
      ? { public: true }
      : { requiresAuth: ['/corretoras', '/dashboard', '/configuracoes'].includes(path) }
}))

describe('Router — destinos aninhados caem no 404 público', () => {
  it('não registra /metas, /recuperar-senha nem /corretoras/:id', () => {
    expect(productionPaths).toContain('/corretoras')
    expect(productionPaths).toContain('/:pathMatch(.*)*')
    expect(productionPaths).not.toContain('/metas')
    expect(productionPaths).not.toContain('/metas/:id')
    expect(productionPaths).not.toContain('/recuperar-senha')
    expect(productionPaths).not.toContain('/corretoras/:id')
    expect(productionPaths).not.toContain('/corretoras/:id/configuracao')
  })

  it.each([
    '/corretoras/conn-xp',
    '/corretoras/conn-xp/configuracao',
    '/metas',
    '/metas/1',
    '/recuperar-senha'
  ])('%s resolve para o catch-all Error404 (público)', async (path) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: productionRoutes
    })
    await router.push(path)

    expect(router.currentRoute.value.name).toBe('Error404')
    expect(router.currentRoute.value.meta.public).toBe(true)
    expect(router.currentRoute.value.matched[0]?.beforeEnter).toBeUndefined()
  })

  it('catch-all no source é público e sem requireAuth', () => {
    const catchAll = routerSource.split("path: '/:pathMatch(.*)*'")[1]?.slice(0, 400)

    expect(catchAll).toContain("name: 'Error404'")
    expect(catchAll).toContain('public: true')
    expect(catchAll).not.toContain('requireAuth')
    expect(catchAll).not.toContain('requiresAuth: true')
  })
})
