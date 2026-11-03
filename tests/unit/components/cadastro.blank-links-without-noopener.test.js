import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const cadastroSource = readFileSync(
  resolve(__dirname, '../../../src/components/Cadastro.vue'),
  'utf8'
)

describe('Cadastro — links legais abrem em nova aba sem rel=noopener', () => {
  it('Termos e Privacidade usam target=_blank sem noopener/noreferrer', () => {
    const template = cadastroSource.slice(
      0,
      cadastroSource.indexOf('<script setup>')
    )

    expect(template).toMatch(/<router-link to="\/termos" target="_blank"/)
    expect(template).toMatch(/<router-link to="\/privacidade" target="_blank"/)

    expect(template).not.toMatch(/rel=["'][^"']*noopener/)
    expect(template).not.toMatch(/rel=["'][^"']*noreferrer/)
    expect(cadastroSource).not.toMatch(/noopener|noreferrer/)
  })
})
