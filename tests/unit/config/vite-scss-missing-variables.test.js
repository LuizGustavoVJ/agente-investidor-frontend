import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const viteSource = readFileSync(resolve(root, 'vite.config.js'), 'utf8')

describe('Vite — additionalData SCSS aponta para arquivo inexistente', () => {
  it('preprocessorOptions.scss injeta @/styles/variables.scss em todo CSS', () => {
    expect(viteSource).toMatch(/preprocessorOptions/)
    expect(viteSource).toMatch(/scss:/)
    expect(viteSource).toMatch(/additionalData:\s*`@import "@\/styles\/variables\.scss";`/)
  })

  it('src/styles/variables.scss não existe — qualquer .scss quebre o build/dev server', () => {
    expect(existsSync(resolve(root, 'src/styles/variables.scss'))).toBe(false)
    expect(existsSync(resolve(root, 'src/styles'))).toBe(false)
  })
})
