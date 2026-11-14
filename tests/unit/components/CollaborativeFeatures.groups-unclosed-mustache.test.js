import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { parse } from 'vue/compiler-sfc'

const source = readFileSync(
  resolve(__dirname, '../../../src/components/CollaborativeFeatures.vue'),
  'utf8'
)

const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}m atrás`
  } else if (hours < 24) {
    return `${hours}h atrás`
  } else {
    return `${days}d atrás`
  }
}

describe('CollaborativeFeatures — aba Grupos com interpolação quebrada', () => {
  it('escreve {{ group.posts } sem fechar o mustache nos cards meus e recomendados', () => {
    const unclosed = source.match(/\{\{\s*group\.posts\s*\}(?!\})/g) || []
    expect(unclosed.length).toBe(2)
    expect(source).toMatch(/stat-label">posts</)
    expect(source).toMatch(/stat-label">posts\/dia</)
    expect(source).not.toMatch(/\{\{\s*group\.posts\s*\}\}/)
  })

  it('o SFC não compila — montar a aba Grupos derruba a superfície autenticada', () => {
    const { errors, descriptor } = parse(source, { filename: 'CollaborativeFeatures.vue' })
    const parseMessages = errors.map((error) => error.message || String(error)).join('\n')
    const templateErrors = descriptor.template?.errors || []
    const templateMessages = templateErrors
      .map((error) => (typeof error === 'string' ? error : error.message || String(error)))
      .join('\n')
    const all = `${parseMessages}\n${templateMessages}`

    expect(errors.length + templateErrors.length).toBeGreaterThan(0)
    expect(all).toMatch(/error|parse|invalid|unexpected|missing/i)
  })

  it('formatTime da atividade recente não guarda Date — ISO string ou Invalid Date vira "NaNd atrás"', () => {
    const fn = source.slice(
      source.indexOf('const formatTime = (date)'),
      source.indexOf('onMounted(() => {')
    )
    expect(fn).toMatch(/const diff = now - date/)
    expect(fn).not.toMatch(/instanceof Date|isValid|Number\.isNaN|isNaN\(diff\)/)

    expect(formatTime('2024-01-15T12:00:00.000Z')).toBe('NaNd atrás')
    expect(formatTime(new Date('not-a-date'))).toBe('NaNd atrás')
    expect(formatTime(undefined)).toBe('NaNd atrás')
  })
})
