import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard — formatTime com ISO string', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('formatTime com ISO string lança RangeError/TypeError no Intl', () => {
    vi.useFakeTimers()
    wrapper = mount(SystemHealthDashboard)

    expect(() => wrapper.vm.formatTime('2026-09-27T10:00:00.000Z')).toThrow()
  })

  it('formatTime com Date devolve horário pt-BR', () => {
    vi.useFakeTimers()
    wrapper = mount(SystemHealthDashboard)

    const formatted = wrapper.vm.formatTime(new Date('2026-09-27T10:08:00.000Z'))

    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/)
  })
})
