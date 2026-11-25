import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn()
  }))
}))

import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

describe('SystemHealthDashboard: refresh clampa network em 100 e ignora disk', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    wrapper = mount(SystemHealthDashboard)
    await vi.advanceTimersByTimeAsync(2100)
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('network em MB/s é limitada a 100 e disk nunca recebe status por limiar', async () => {
    const network = wrapper.vm.mainMetrics.find((metric) => metric.id === 'network')
    const disk = wrapper.vm.mainMetrics.find((metric) => metric.id === 'disk')

    expect(parseFloat(network.currentValue)).toBeLessThanOrEqual(100)
    expect(network.percentage).toBeLessThanOrEqual(100)

    disk.currentValue = '95.0'
    disk.percentage = 95
    disk.status = 'healthy'

    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const refresh = wrapper.vm.refreshData()
    await vi.advanceTimersByTimeAsync(2000)
    await refresh
    await flushPromises()

    expect(disk.status).toBe('healthy')
    expect(disk.percentage).toBeGreaterThan(80)
    expect(wrapper.vm.overallStatus.status).toBe('healthy')
  })
})
