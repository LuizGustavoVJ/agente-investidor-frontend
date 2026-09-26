import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CollaborativeFeatures from '@/components/CollaborativeFeatures.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('CollaborativeFeatures — participants string concatena no join', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CollaborativeFeatures)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('participants "1247" vira "12471" em vez de 1248', () => {
    const competition = {
      title: 'Desafio Value',
      isParticipating: false,
      participants: '1247'
    }

    wrapper.vm.joinCompetition(competition)

    expect(competition.isParticipating).toBe(true)
    expect(competition.participants).toBe('12471')
  })

  it('participants numérico incrementa corretamente', () => {
    const competition = {
      title: 'Trading Semanal',
      isParticipating: false,
      participants: 456
    }

    wrapper.vm.joinCompetition(competition)

    expect(competition.participants).toBe(457)
  })
})
