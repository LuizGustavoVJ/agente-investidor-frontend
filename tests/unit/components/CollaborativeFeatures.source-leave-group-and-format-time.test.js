import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const source = readFileSync(
  resolve(process.cwd(), 'src/components/CollaborativeFeatures.vue'),
  'utf8'
)

describe('CollaborativeFeatures (fonte): leaveGroup e formatTime', () => {
  it('o template ainda tem o mustache quebrado em group.posts — não montar este SFC', () => {
    expect(source).toMatch(/\{\{\s*group\.posts\s*\}/)
    expect(source).not.toMatch(/\{\{\s*group\.posts\s*\}\}/)
  })

  it('leaveGroup só faz splice em myGroups — não decrementa members nem devolve o grupo para recommendedGroups', () => {
    const leaveBlock = source.slice(
      source.indexOf('const leaveGroup'),
      source.indexOf('const joinGroup')
    )

    expect(leaveBlock).toMatch(/myGroups\.splice/)
    expect(leaveBlock).not.toMatch(/members\s*-/)
    expect(leaveBlock).not.toMatch(/recommendedGroups/)
    expect(leaveBlock).not.toMatch(/unshift|push/)
  })

  it('joinGroup só alerta e não empurra o grupo para myGroups', () => {
    const joinBlock = source.slice(
      source.indexOf('const joinGroup'),
      source.indexOf('const previewGroup')
    )

    expect(joinBlock).toMatch(/alert\(/)
    expect(joinBlock).not.toMatch(/myGroups\.push/)
    expect(joinBlock).not.toMatch(/members\s*\+/)
  })

  it('formatTime subtrai Date cru — ISO string vira NaN e cai no ramo de dias', () => {
    const start = source.indexOf('const formatTime = (date)')
    const formatBlock = source.slice(start, start + 600)

    expect(start).toBeGreaterThan(-1)
    expect(formatBlock).toMatch(/const diff = now - date/)
    expect(formatBlock).not.toMatch(/new Date\(date\)/)
    expect(formatBlock).toMatch(/\$\{days\}d atrás/)
  })
})
