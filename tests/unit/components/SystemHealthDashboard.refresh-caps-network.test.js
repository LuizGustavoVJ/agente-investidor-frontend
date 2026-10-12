import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Chart from 'chart.js/auto'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard — refresh trata Network I/O como percentual 0–100', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-12T10:00:00.000Z'))
    Chart.mockClear()
    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('refreshData limita currentValue a 100 — Network começa em 125.3 MB/s e vira 100.0', async () => {
    const network = wrapper.vm.mainMetrics.find((metric) => metric.id === 'network')
    expect(network.currentValue).toBe('125.3')
    expect(network.unit).toBe('MB/s')
    expect(network.percentage).toBe(62.6)
    expect(network.status).toBe('healthy')

    await vi.advanceTimersByTimeAsync(2100)
    await flushPromises()

    expect(network.currentValue).toBe('100.0')
    expect(network.percentage).toBe(100)
    expect(network.status).toBe('healthy')
  })

  it('só CPU e memória atualizam status — disk/network altos não mudam o badge', async () => {
    const disk = wrapper.vm.mainMetrics.find((metric) => metric.id === 'disk')
    const network = wrapper.vm.mainMetrics.find((metric) => metric.id === 'network')
    disk.currentValue = '95'
    disk.percentage = 95
    disk.status = 'healthy'
    network.status = 'healthy'

    const pending = wrapper.vm.refreshData()
    await vi.advanceTimersByTimeAsync(2000)
    await pending
    await flushPromises()

    expect(disk.status).toBe('healthy')
    expect(network.status).toBe('healthy')
    expect(wrapper.vm.overallStatus.status).toBe('healthy')
  })
})
