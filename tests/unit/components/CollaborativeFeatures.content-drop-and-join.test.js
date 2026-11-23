import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('CollaborativeFeatures: conteúdo descartado e join só de alerta', () => {
  const source = readFileSync(
    resolve(__dirname, '../../../src/components/CollaborativeFeatures.vue'),
    'utf8'
  )

  it('createArticle persiste type/title/description e descarta newArticle.content', () => {
    expect(source).toMatch(/type:\s*newArticle\.type/)
    expect(source).toMatch(/title:\s*newArticle\.title/)
    expect(source).toMatch(/description:\s*newArticle\.description/)
    expect(source).not.toMatch(/content:\s*newArticle\.content/)
    expect(source).toMatch(/newArticle\.tags\.split/)
  })

  it('createTopic só guarda excerpt — o corpo newTopic.content não entra no tópico', () => {
    expect(source).toMatch(/excerpt:\s*newTopic\.content\.substring\(0,\s*100\)/)
    expect(source).not.toMatch(/content:\s*newTopic\.content/)
  })

  it('joinGroup e enterGroup só alertam — não fazem push em myGroups nem incrementam members', () => {
    expect(source).toMatch(/alert\(`\$\{group\.isPrivate \? 'Solicitando entrada no' : 'Entrando no'\} grupo: \$\{group\.name\}`\)/)
    expect(source).toMatch(/alert\(`Entrando no grupo: \$\{group\.name\}`\)/)
    expect(source).not.toMatch(/myGroups\.(push|unshift)/)
    expect(source).not.toMatch(/group\.members\s*\+=/)
  })

  it('joinCompetition marca isParticipating e soma participants, mas não empurra para myCompetitions', () => {
    expect(source).toMatch(/competition\.isParticipating = true/)
    expect(source).toMatch(/competition\.participants \+= 1/)
    expect(source).not.toMatch(/myCompetitions\.(push|unshift)/)
  })
})
