import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const indexHtml = readFileSync(resolve(__dirname, '../../../index.html'), 'utf8')
const viteConfig = readFileSync(resolve(__dirname, '../../../vite.config.js'), 'utf8')

describe('index.html / Vite — sem CSP nem proteção contra iframe; sourcemap de produção ligado', () => {
  it('index.html não define CSP, frame-ancestors nem X-Frame-Options — o login pode ser iframado', () => {
    expect(indexHtml).toMatch(/<div id="app">/)
    expect(indexHtml).not.toMatch(/Content-Security-Policy|content-security-policy/)
    expect(indexHtml).not.toMatch(/frame-ancestors|X-Frame-Options|x-frame-options/)
    expect(indexHtml).not.toMatch(/Content-Security-Policy-Report-Only/)
  })

  it('build.sourcemap fica true — o bundle de produção entrega o fonte (interceptors, rotas, stores)', () => {
    const buildBlock = viteConfig.slice(
      viteConfig.indexOf('build: {'),
      viteConfig.indexOf('css: {')
    )

    expect(buildBlock).toMatch(/sourcemap:\s*true/)
    expect(buildBlock).not.toMatch(/sourcemap:\s*false/)
    expect(buildBlock).not.toMatch(/hidden/)
  })
})
