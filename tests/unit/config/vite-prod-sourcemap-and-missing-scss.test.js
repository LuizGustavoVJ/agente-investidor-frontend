import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const vite = readFileSync(resolve(root, 'vite.config.js'), 'utf8')

describe('Vite — sourcemap de produção e SCSS inexistente', () => {
  it('build.sourcemap é true — o bundle de produção entrega o Vue original (stores, client, rotas)', () => {
    const buildBlock = vite.slice(
      vite.indexOf('// Configuração de build'),
      vite.indexOf('// Configuração de CSS')
    )

    expect(buildBlock).toMatch(/sourcemap:\s*true/)
    expect(buildBlock).not.toMatch(/sourcemap:\s*['"]hidden['"]/)
    expect(buildBlock).not.toMatch(/sourcemap:\s*false/)
  })

  it('todo arquivo SCSS recebe @import "@/styles/variables.scss", mas o ficheiro e o diretório não existem', () => {
    expect(vite).toMatch(/additionalData:\s*`@import "@\/styles\/variables\.scss";`/)
    expect(existsSync(resolve(root, 'src/styles/variables.scss'))).toBe(false)
    expect(existsSync(resolve(root, 'src/styles'))).toBe(false)
    expect(existsSync(resolve(root, 'src/utils'))).toBe(false)
  })
})
