import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const style = readFileSync(resolve(root, 'src/style.css'), 'utf8')
const main = readFileSync(resolve(root, 'src/main.js'), 'utf8')
const html = readFileSync(resolve(root, 'index.html'), 'utf8')

describe('Google Fonts — vazamento de navegação autenticada para terceiros', () => {
  it('style.css importa Montserrat/Inter de fonts.googleapis.com (CSS de terceiros)', () => {
    expect(style).toMatch(
      /@import url\(['"]https:\/\/fonts\.googleapis\.com\/css2\?family=Montserrat/
    )
    expect(style).toMatch(/family=Inter/)
    expect(style).not.toMatch(/@font-face/)
  })

  it('main.js aplica style.css globalmente — login, cadastro e dashboard disparam o pedido ao Google', () => {
    expect(main).toMatch(/import ['"]\.\/style\.css['"]/)
    expect(html).not.toMatch(/preconnect[^>]+fonts\.gstatic\.com/)
    expect(html).not.toMatch(/preconnect[^>]+fonts\.googleapis\.com/)
  })
})
