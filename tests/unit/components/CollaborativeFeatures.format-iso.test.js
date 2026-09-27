import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CollaborativeFeatures from '@/components/CollaborativeFeatures.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('CollaborativeFeatures — formatTime/formatDate com ISO string', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CollaborativeFeatures)
  })

  it('formatTime com ISO string vira "NaNd atrás" em vez de tempo relativo', () => {
    const formatted = wrapper.vm.formatTime('2026-09-27T10:00:00.000Z')

    expect(formatted).toMatch(/NaN/)
    expect(formatted).toBe('NaNd atrás')
  })

  it('formatTime com Date recente devolve minutos, não NaN', () => {
    const formatted = wrapper.vm.formatTime(new Date(Date.now() - 5 * 60 * 1000))

    expect(formatted).toBe('5m atrás')
  })

  it('formatDate com ISO string lança (Intl não aceita string)', () => {
    expect(() => wrapper.vm.formatDate('2026-09-27T10:00:00.000Z')).toThrow()
  })

  it('formatDate com Date formata em pt-BR', () => {
    const formatted = wrapper.vm.formatDate(new Date('2026-09-27T10:00:00.000Z'))

    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
})
