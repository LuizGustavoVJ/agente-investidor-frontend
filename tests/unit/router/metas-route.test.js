import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const routerSource = readFileSync(resolve(__dirname, '../../../src/router/index.js'), 'utf8')

describe('Router — rota autenticada /metas', () => {
  it('registra Metas.vue com requireAuth (Dashboard navega para /metas)', () => {
    const block = routerSource.split("path: '/metas'")[1]?.slice(0, 400)

    expect(block).toBeTruthy()
    expect(block).toContain("name: 'Metas'")
    expect(block).toContain("import('@/views/Metas.vue')")
    expect(block).toContain('beforeEnter: requireAuth')
    expect(block).toContain('requiresAuth: true')
    expect(existsSync(resolve(__dirname, '../../../src/views/Metas.vue'))).toBe(true)
  })
})
