import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const mainSource = readFileSync(resolve(root, 'src/main.js'), 'utf8')
const appSource = readFileSync(resolve(root, 'src/App.vue'), 'utf8')
const layoutSource = readFileSync(resolve(root, 'src/components/Layout.vue'), 'utf8')

describe('Bootstrap — app.config.errorHandler ausente', () => {
  it('main.js monta Toast e Pinia, mas não registra errorHandler nem warnHandler', () => {
    expect(mainSource).toMatch(/app\.use\(Toast/)
    expect(mainSource).toMatch(/app\.use\(pinia\)/)
    expect(mainSource).toMatch(/app\.mount\(['"]#app['"]\)/)
    expect(mainSource).not.toMatch(/app\.config\.errorHandler/)
    expect(mainSource).not.toMatch(/app\.config\.warnHandler/)
  })

  it('App.vue só renderiza router-view — não há error boundary em volta das rotas', () => {
    expect(appSource).toMatch(/<router-view\s*\/>/)
    expect(appSource).not.toMatch(/onErrorCaptured/)
    expect(appSource).not.toMatch(/errorCaptured/)
  })

  it('Layout.vue chama usuario.nome.charAt(0) — string vazia/nula quebra o render sem handler global', () => {
    expect(layoutSource).toMatch(/usuario\.nome\.charAt\(0\)/)
  })
})
