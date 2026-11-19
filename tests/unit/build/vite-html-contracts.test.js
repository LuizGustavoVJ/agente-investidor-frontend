import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const root = resolve(__dirname, '../../..')
const read = (rel) => readFileSync(resolve(root, rel), 'utf8')

describe('Contratos de build, HTML e dependências', () => {
  it('package.json declara lodash, mas vite otimiza lodash-es', () => {
    const pkg = JSON.parse(read('package.json'))
    const vite = read('vite.config.js')

    expect(pkg.dependencies.lodash).toBeDefined()
    expect(pkg.dependencies['lodash-es']).toBeUndefined()
    expect(vite).toMatch(/['"]lodash-es['"]/)
    expect(vite).not.toMatch(/include:\s*\[[^\]]*['"]lodash['"]/)
  })

  it('alias @utils e import SCSS apontam para arquivos inexistentes', () => {
    const vite = read('vite.config.js')
    expect(vite).toMatch(/@utils['"]:\s*resolve\(__dirname,\s*['"]src\/utils['"]\)/)
    expect(vite).toContain('@/styles/variables.scss')
    expect(existsSync(resolve(root, 'src/utils'))).toBe(false)
    expect(existsSync(resolve(root, 'src/styles/variables.scss'))).toBe(false)
  })

  it('dev server escuta em host:true com cors:true; build gera sourcemap', () => {
    const vite = read('vite.config.js')
    expect(vite).toMatch(/host:\s*true/)
    expect(vite).toMatch(/cors:\s*true/)
    expect(vite).toMatch(/sourcemap:\s*true/)
  })

  it('index.html está em inglês, título Vite + Vue, sem CSP nem referrer-policy', () => {
    const html = read('index.html')
    expect(html).toMatch(/<html lang="en">/)
    expect(html).toMatch(/<title>Vite \+ Vue<\/title>/)
    expect(html).toContain('href="/vite.svg"')
    expect(html).not.toMatch(/content-security-policy/i)
    expect(html).not.toMatch(/referrer-policy/i)
  })

  it('.gitignore não ignora .env — risco de commitar segredo', () => {
    const gitignore = read('.gitignore')
    expect(gitignore).not.toMatch(/(^|\n)\.env(\n|$)/)
    expect(gitignore).not.toMatch(/(^|\n)\.env\.\*(\n|$)/)
  })

  it('js-cookie está nas dependências mas nenhum fonte o importa', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies['js-cookie']).toBeDefined()

    const files = [
      'src/main.js',
      'src/api/client.js',
      'src/stores/auth.js',
      'src/middleware/auth.js'
    ]
    for (const file of files) {
      expect(read(file)).not.toMatch(/js-cookie/)
    }
  })
})
