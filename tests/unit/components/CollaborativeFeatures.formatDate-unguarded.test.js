import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const source = readFileSync(
  resolve(__dirname, '../../../src/components/CollaborativeFeatures.vue'),
  'utf8'
)

const formatDate = (date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

describe('CollaborativeFeatures — formatDate do fórum/conhecimento sem guarda', () => {
  it('template formata createdAt, lastReply.date e publishedAt sem isValid', () => {
    expect(source).toMatch(/formatDate\(topic\.createdAt\)/)
    expect(source).toMatch(/formatDate\(topic\.lastReply\.date\)/)
    expect(source).toMatch(/formatDate\(item\.publishedAt\)/)

    const fn = source.slice(
      source.indexOf('const formatDate = (date)'),
      source.indexOf('const formatTime = (date)')
    )
    expect(fn).toMatch(/Intl\.DateTimeFormat/)
    expect(fn).not.toMatch(/if\s*\(\s*!date/)
    expect(fn).not.toMatch(/isValid|isNaN|Invalid Date/)
  })

  it('Intl.DateTimeFormat lança em Invalid Date — data lixo no tópico derruba a aba Fórum', () => {
    expect(() => formatDate(new Date('not-a-date'))).toThrow(RangeError)
    expect(() => formatDate('not-a-date')).toThrow()
  })
})
