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

describe('SystemHealthDashboard — canvas de performance nunca é encontrado', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-11T10:00:00.000Z'))
    Chart.mockClear()
    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('createCharts consulta [ref="cpuChart"] — atributo que o Vue não renderiza', async () => {
    await vi.advanceTimersByTimeAsync(2100)
    await flushPromises()

    expect(wrapper.find('canvas.performance-chart').exists()).toBe(true)
    expect(document.querySelector('[ref="cpuChart"]')).toBeNull()
    expect(document.querySelector('[ref="memoryChart"]')).toBeNull()

    expect(Chart).toHaveBeenCalled()
    expect(Chart.mock.calls[0][0]).toBeNull()
    expect(Chart.mock.calls.some((call) => call[0] instanceof HTMLCanvasElement)).toBe(false)
  })
})
