import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard — viewLogs sem coluna de logs', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    try {
      wrapper?.unmount()
    } catch {
      // Chart.js pode não ter sido inicializado
    }
    vi.clearAllTimers()
    vi.useRealTimers()
    Math.random.mockRestore?.()
    window.confirm.mockRestore?.()
    window.alert.mockRestore?.()
  })

  it('viewLogs lança TypeError se .logs-column não existir no DOM', async () => {
    wrapper = mount(SystemHealthDashboard)
    await wrapper.vm.$nextTick()

    vi.spyOn(document, 'querySelector').mockReturnValue(null)

    expect(() =>
      wrapper.vm.viewLogs({ id: 'auth-service', name: 'Auth Service' })
    ).toThrow(TypeError)

    document.querySelector.mockRestore()
  })
})
