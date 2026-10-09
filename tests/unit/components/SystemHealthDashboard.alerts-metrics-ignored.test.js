import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard — alertas e métricas não alimentam o banner', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('memória já nasce em warning e há alertas warning, mas overallStatus continua healthy', () => {
    const memory = wrapper.vm.mainMetrics.find((m) => m.id === 'memory')
    expect(memory.status).toBe('warning')
    expect(memory.percentage).toBeGreaterThan(60)

    const warningAlerts = wrapper.vm.activeAlerts.filter((a) => a.severity === 'warning')
    expect(warningAlerts.length).toBeGreaterThan(0)

    expect(wrapper.vm.overallStatus.status).toBe('healthy')
    expect(wrapper.vm.overallStatus.description).toBe(
      'Todos os serviços funcionando normalmente'
    )
    expect(wrapper.find('.status-card.healthy').exists()).toBe(true)
  })

  it('há log de error no painel e o banner segue healthy', () => {
    const errors = wrapper.vm.filteredLogs.filter((l) => l.level === 'error')
    expect(errors.length).toBeGreaterThan(0)
    expect(wrapper.vm.overallStatus.status).toBe('healthy')
  })

  it('resolveAlert remove o alerta e não altera overallStatus', async () => {
    const initialCount = wrapper.vm.activeAlerts.length
    const first = wrapper.vm.activeAlerts[0]
    expect(first.severity).toBe('warning')

    wrapper.vm.resolveAlert(first)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.activeAlerts.length).toBe(initialCount - 1)
    expect(wrapper.vm.overallStatus.status).toBe('healthy')
    expect(wrapper.find('.status-card.healthy').exists()).toBe(true)
  })

  it('acknowledgeAlert marca acknowledged mas o banner e a lista de alertas permanecem', async () => {
    const alert = wrapper.vm.activeAlerts[0]
    const count = wrapper.vm.activeAlerts.length

    wrapper.vm.acknowledgeAlert(alert)
    await wrapper.vm.$nextTick()

    expect(alert.acknowledged).toBe(true)
    expect(wrapper.vm.activeAlerts.length).toBe(count)
    expect(wrapper.vm.overallStatus.status).toBe('healthy')
  })
})
