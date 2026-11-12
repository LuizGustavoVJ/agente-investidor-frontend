import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const html = readFileSync(resolve(root, 'index.html'), 'utf8')

describe('index.html — identidade pública (favicon Vite e metadados sociais ausentes)', () => {
  it('usa /vite.svg como favicon em vez de logo-zenda.png', () => {
    expect(html).toMatch(/rel="icon"[^>]*href="\/vite\.svg"/)
    expect(html).not.toMatch(/logo-zenda/)
    expect(existsSync(resolve(root, 'public/vite.svg'))).toBe(true)
    expect(existsSync(resolve(root, 'src/assets/logo-zenda.png'))).toBe(true)
  })

  it('não declara apple-touch-icon nem theme-color — home screen e barra do mobile ficam genéricas', () => {
    expect(html).not.toMatch(/apple-touch-icon/)
    expect(html).not.toMatch(/theme-color/)
    expect(html).not.toMatch(/manifest\.webmanifest|manifest\.json/)
  })

  it('não tem Open Graph, Twitter Card nem canonical — preview de /login e /cadastro parece Vite', () => {
    expect(html).not.toMatch(/og:title|og:image|og:description|property="og:/)
    expect(html).not.toMatch(/twitter:card|twitter:title|name="twitter/)
    expect(html).not.toMatch(/rel="canonical"/)
  })
})
