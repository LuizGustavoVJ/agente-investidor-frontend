import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Router — Layout fora do shell autenticado', () => {
  const routerSource = readFileSync(
    resolve(process.cwd(), 'src/router/index.js'),
    'utf8'
  )
  const dashboardSource = readFileSync(
    resolve(process.cwd(), 'src/components/Dashboard.vue'),
    'utf8'
  )
  const layoutSource = readFileSync(
    resolve(process.cwd(), 'src/components/Layout.vue'),
    'utf8'
  )

  it('não envolve rotas autenticadas com Layout (logout/perfil ficam inacessíveis)', () => {
    expect(routerSource).not.toMatch(/import\s+Layout\s+from/)
    expect(routerSource).not.toMatch(/component:\s*Layout/)
    expect(routerSource).not.toMatch(/children:\s*\[/)
  })

  it('Dashboard autenticado não importa Layout nem dispara logout da store', () => {
    expect(dashboardSource).not.toMatch(/Layout\.vue/)
    expect(dashboardSource).not.toMatch(/authStore\.logout/)
    expect(dashboardSource).not.toMatch(/logout\s*\(/)
  })

  it('Layout.logout só redireciona — não chama authStore nem POST /auth/logout', () => {
    expect(layoutSource).toMatch(/window\.location\.href\s*=\s*['"]\/login['"]/)
    expect(layoutSource).not.toMatch(/useAuthStore/)
    expect(layoutSource).not.toMatch(/authAPI\.logout|authStore\.logout/)
  })
})
