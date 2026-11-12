import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const root = resolve(__dirname, '../../..')
const dashboard = readFileSync(resolve(root, 'src/components/Dashboard.vue'), 'utf8')
const corretoras = readFileSync(resolve(root, 'src/views/Corretoras.vue'), 'utf8')
const configuracoes = readFileSync(resolve(root, 'src/views/Configuracoes.vue'), 'utf8')
const metas = readFileSync(resolve(root, 'src/views/Metas.vue'), 'utf8')

describe('formatDate — data inválida derruba dashboard, corretoras, configs e metas', () => {
  it('date-fns format e formatDistanceToNow lançam em Invalid Date', () => {
    const invalid = new Date('not-a-date')
    expect(Number.isNaN(invalid.getTime())).toBe(true)

    expect(() =>
      format(invalid, 'dd/MM/yyyy HH:mm', { locale: ptBR })
    ).toThrow()
    expect(() =>
      formatDistanceToNow(invalid, { addSuffix: true, locale: ptBR })
    ).toThrow()
  })

  it('Dashboard/Corretoras/Configurações/Metas só tratam date falsy — string lixo passa no guard', () => {
    for (const source of [dashboard, corretoras, configuracoes, metas]) {
      expect(source).toMatch(/if\s*\(\s*!date\s*\)\s*return/)
      expect(source).toMatch(/format\(\s*new Date\(date\)/)
      expect(source).not.toMatch(/isValid|isNaN\(|Number\.isNaN|Invalid Date/)
    }
  })

  it('Corretoras.getTimeAgo também só guarda falsy antes de formatDistanceToNow', () => {
    expect(corretoras).toMatch(
      /formatDistanceToNow\(\s*new Date\(date\)/
    )
    const getTimeAgo = corretoras.slice(
      corretoras.indexOf('const getTimeAgo'),
      corretoras.indexOf('const getOverallStatusIcon')
    )
    expect(getTimeAgo).toMatch(/if\s*\(\s*!date\s*\)\s*return/)
    expect(getTimeAgo).not.toMatch(/isValid|isNaN/)
  })
})
