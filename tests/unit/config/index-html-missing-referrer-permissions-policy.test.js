import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const html = readFileSync(
  resolve(__dirname, '../../../index.html'),
  'utf8'
)

describe('index.html — cabeçalhos de privacidade ausentes', () => {
  it('não declara Referrer-Policy — o documento não restringe o referrer em navegações e assets', () => {
    expect(html).not.toMatch(/referrer-policy/i)
    expect(html).not.toMatch(/no-referrer|strict-origin-when-cross-origin/i)
    expect(html).not.toMatch(/<meta[^>]+name=["']referrer["']/i)
  })

  it('não declara Permissions-Policy — câmera, geolocation e interesse de ads ficam no default do browser', () => {
    expect(html).not.toMatch(/permissions-policy/i)
    expect(html).not.toMatch(/feature-policy/i)
    expect(html).not.toMatch(/geolocation=\(\)|camera=\(\)|microphone=\(\)/)
  })
})
