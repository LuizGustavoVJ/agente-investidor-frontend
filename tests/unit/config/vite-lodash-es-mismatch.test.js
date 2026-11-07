import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const viteSource = readFileSync(resolve(root, 'vite.config.js'), 'utf8')

describe('Vite — lodash-es no prebundle sem depender do pacote', () => {
  it('package.json declara lodash, não lodash-es', () => {
    expect(pkg.dependencies.lodash).toBeDefined()
    expect(pkg.dependencies['lodash-es']).toBeUndefined()
    expect(pkg.devDependencies?.['lodash-es']).toBeUndefined()
  })

  it('optimizeDeps e manualChunks pedem lodash-es — prebundle/split apontam para módulo ausente', () => {
    const optimizeBlock = viteSource.slice(
      viteSource.indexOf('optimizeDeps:'),
      viteSource.length
    )

    expect(optimizeBlock).toMatch(/['"]lodash-es['"]/)
    expect(viteSource).toMatch(/utils:\s*\[[^\]]*['"]lodash-es['"]/)
    expect(viteSource).not.toMatch(/optimizeDeps:[\s\S]*['"]lodash['"]/)
  })
})
