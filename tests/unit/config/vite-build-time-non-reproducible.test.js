import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const viteSource = readFileSync(resolve(root, 'vite.config.js'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const mainSource = readFileSync(resolve(root, 'src/main.js'), 'utf8')

const defineBlock = viteSource.slice(
  viteSource.indexOf('define:'),
  viteSource.indexOf('optimizeDeps:')
)

describe('Vite — __BUILD_TIME__ e versão da app não reproduzíveis / dessincronizados', () => {
  it('__BUILD_TIME__ usa new Date().toISOString() na avaliação do config — o mesmo commit gera bundles diferentes', () => {
    expect(defineBlock).toMatch(/__BUILD_TIME__:\s*JSON\.stringify\(\s*new Date\(\)\.toISOString\(\)\s*\)/)
  })

  it('__APP_VERSION__ vem do package.json, mas main.js ignora e hardcodeia 1.0.0', () => {
    expect(defineBlock).toMatch(/__APP_VERSION__:\s*JSON\.stringify\(\s*process\.env\.npm_package_version\s*\)/)
    expect(pkg.version).toBe('0.0.0')
    expect(mainSource).toMatch(/\$APP_VERSION\s*=\s*['"]1\.0\.0['"]/)
    expect(mainSource).not.toMatch(/__APP_VERSION__/)
  })
})
