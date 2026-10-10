import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard — auto-refresh não para ao desmarcar', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-10T10:00:00.000Z'))
    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('watchAutoRefresh existe mas desmarcar o checkbox não cancela o intervalo de 30s', async () => {
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    const afterMount = wrapper.vm.overallStatus.lastUpdate
    expect(afterMount).toBeTruthy()

    expect(typeof wrapper.vm.watchAutoRefresh).toBe('function')

    wrapper.vm.autoRefresh = false
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.autoRefresh).toBe(false)

    await vi.advanceTimersByTimeAsync(30000)
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    expect(wrapper.vm.autoRefresh).toBe(false)
    expect(wrapper.vm.overallStatus.lastUpdate).not.toBe(afterMount)
    expect(wrapper.vm.overallStatus.lastUpdate.getTime()).toBeGreaterThan(afterMount.getTime())
  })
})
