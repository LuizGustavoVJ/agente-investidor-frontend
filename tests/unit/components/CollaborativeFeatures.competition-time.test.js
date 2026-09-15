import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CollaborativeFeatures from '@/components/CollaborativeFeatures.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('CollaborativeFeatures — competição e tempo relativo', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'))
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    wrapper = mount(CollaborativeFeatures)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('joinCompetition com participants ausente vira NaN', () => {
    const competition = { title: 'Desafio Value', isParticipating: false }

    wrapper.vm.joinCompetition(competition)

    expect(competition.isParticipating).toBe(true)
    expect(Number.isNaN(competition.participants)).toBe(true)
  })

  it('joinCompetition incrementa quando participants já é número', () => {
    const competition = {
      title: 'Trading Semanal',
      isParticipating: false,
      participants: 456
    }

    wrapper.vm.joinCompetition(competition)

    expect(competition.isParticipating).toBe(true)
    expect(competition.participants).toBe(457)
  })

  it('formatTime com data futura gera minutos negativos', () => {
    const future = new Date('2026-09-15T12:30:00.000Z')

    expect(wrapper.vm.formatTime(future)).toBe('-30m atrás')
  })
})
