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

describe('SystemHealthDashboard — refresh ignora SLA e reconhecimento não esconde alerta', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-13T10:00:00.000Z'))
    Chart.mockClear()
    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('refreshData muda lastUpdate mas preserva disponibilidade/erro/throughput do SLA', async () => {
    wrapper.vm.slaMetrics.availability = 91.11
    wrapper.vm.slaMetrics.errorRate = 7.7
    wrapper.vm.slaMetrics.throughput = 12
    const lastUpdateBefore = wrapper.vm.overallStatus.lastUpdate

    const pending = wrapper.vm.refreshData()
    await vi.advanceTimersByTimeAsync(2000)
    await pending
    await flushPromises()

    expect(wrapper.vm.slaMetrics.availability).toBe(91.11)
    expect(wrapper.vm.slaMetrics.errorRate).toBe(7.7)
    expect(wrapper.vm.slaMetrics.throughput).toBe(12)
    expect(wrapper.vm.overallStatus.lastUpdate).not.toBe(lastUpdateBefore)
  })

  it('acknowledgeAlert marca acknowledged mas o alerta continua em activeAlerts', async () => {
    await vi.advanceTimersByTimeAsync(2100)
    await flushPromises()

    const before = wrapper.vm.activeAlerts.length
    expect(before).toBeGreaterThan(0)

    const alert = wrapper.vm.activeAlerts[0]
    wrapper.vm.acknowledgeAlert(alert)

    expect(alert.acknowledged).toBe(true)
    expect(wrapper.vm.activeAlerts).toHaveLength(before)
    expect(wrapper.vm.activeAlerts[0].id).toBe(alert.id)
    expect(wrapper.findAll('.alert-item').length).toBe(before)
  })
})
