import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const html = readFileSync(
  resolve(__dirname, '../../../index.html'),
  'utf8'
)

const routerSource = readFileSync(
  resolve(__dirname, '../../../src/router/index.js'),
  'utf8'
)

const afterEach = routerSource.slice(
  routerSource.indexOf('router.afterEach'),
  routerSource.indexOf('router.onError')
)

describe('index.html — meta description ausente deixa afterEach no-op', () => {
  it('não há <meta name="description"> no documento', () => {
    expect(html).not.toMatch(/<meta[^>]+name=["']description["']/i)
    expect(html).not.toMatch(/property=["']og:description["']/)
    expect(html).not.toMatch(/name=["']twitter:description["']/)
  })

  it('afterEach só atualiza se querySelector achar a tag — não cria o elemento', () => {
    expect(routerSource).toMatch(/description:\s*'Faça login na sua conta'/)
    expect(afterEach).toMatch(/document\.querySelector\('meta\[name="description"\]'\)/)
    expect(afterEach).toMatch(/if \(metaDescription\)/)
    expect(afterEach).toMatch(/setAttribute\('content', to\.meta\.description\)/)
    expect(afterEach).not.toMatch(/createElement/)
    expect(afterEach).not.toMatch(/appendChild/)
  })
})
