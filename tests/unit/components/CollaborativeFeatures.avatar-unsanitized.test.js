import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const source = readFileSync(
  resolve(__dirname, '../../../src/components/CollaborativeFeatures.vue'),
  'utf8'
)

describe('CollaborativeFeatures — avatares de traders/grupos sem allowlist', () => {
  it('liga :src ao avatar cru em social trading, fórum, conhecimento, grupos e competições', () => {
    expect(source).toMatch(/:src="trader\.avatar"/)
    expect(source).toMatch(/:src="strategy\.traderAvatar"/)
    expect(source).toMatch(/:src="topic\.lastReply\.avatar"/)
    expect(source).toMatch(/:src="item\.author\.avatar"/)
    expect(source).toMatch(/:src="group\.avatar"/)
    expect(source).toMatch(/:src="leader\.avatar"/)
  })

  it('não restringe o URL, não seta referrerpolicy nem onerror — avatar absoluto carrega na superfície autenticada', () => {
    const imgTags = source.match(/<img[\s\S]*?>/g) || []
    expect(imgTags.length).toBeGreaterThanOrEqual(6)

    for (const tag of imgTags) {
      expect(tag).toMatch(
        /:src="(trader\.avatar|strategy\.traderAvatar|topic\.lastReply\.avatar|item\.author\.avatar|group\.avatar|leader\.avatar)"/
      )
      expect(tag).not.toMatch(/referrerpolicy/i)
      expect(tag).not.toMatch(/onerror/)
      expect(tag).not.toMatch(/startsWith|allowlist|trustedHost|crossorigin/)
    }
  })

  it('fixtures apontam para images.unsplash.com — a página autenticada dispara pedidos a terceiro sem Referrer-Policy', () => {
    const unsplash = source.match(/https:\/\/images\.unsplash\.com\/[^'"]+/g) || []
    expect(unsplash.length).toBeGreaterThanOrEqual(10)
    expect(source).not.toMatch(/referrerpolicy/i)
    expect(source).not.toMatch(/crossorigin/)
  })
})
