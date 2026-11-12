import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const corretoras = readFileSync(
  resolve(__dirname, '../../../src/views/Corretoras.vue'),
  'utf8'
)

describe('Corretoras — logo da corretora sem allowlist nem referrerpolicy', () => {
  it('liga :src ao logo cru em cards, modal e histórico de sync', () => {
    const brokerLogo = corretoras.match(/:src="broker\.logo"/g) || []
    const historyLogo = corretoras.match(/:src="entry\.brokerLogo"/g) || []
    expect(brokerLogo.length).toBeGreaterThanOrEqual(3)
    expect(historyLogo.length).toBeGreaterThanOrEqual(1)
  })

  it('não restringe o URL, não seta referrerpolicy e não tem onerror — logo absoluto carrega na página autenticada', () => {
    const imgTags = corretoras.match(/<img[\s\S]*?>/g) || []
    expect(imgTags.length).toBe(4)
    for (const tag of imgTags) {
      expect(tag).toMatch(/:src="(broker\.logo|entry\.brokerLogo)"/)
      expect(tag).not.toMatch(/referrerpolicy/i)
      expect(tag).not.toMatch(/onerror/)
      expect(tag).not.toMatch(/startsWith|allowlist|trustedHost/)
    }
  })
})
