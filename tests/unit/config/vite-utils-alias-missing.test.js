import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const viteSource = readFileSync(resolve(root, 'vite.config.js'), 'utf8')
const vitestSource = readFileSync(resolve(root, 'vitest.config.js'), 'utf8')

describe('Vite — alias @utils aponta para pasta inexistente', () => {
  it('vite.config declara @utils → src/utils', () => {
    expect(viteSource).toMatch(/['"]@utils['"]\s*:\s*resolve\(__dirname,\s*['"]src\/utils['"]\)/)
  })

  it('src/utils não existe no repositório — import @utils/* quebra o bundle', () => {
    expect(existsSync(resolve(root, 'src/utils'))).toBe(false)
  })

  it('vitest.config só aliasa @ — testes que seguirem @utils não resolvem o mesmo mapa', () => {
    expect(vitestSource).toMatch(/['"]@['"]\s*:/)
    expect(vitestSource).not.toMatch(/['"]@utils['"]/)
  })
})
