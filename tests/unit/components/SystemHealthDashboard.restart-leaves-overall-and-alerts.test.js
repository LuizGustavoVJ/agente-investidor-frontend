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

describe('SystemHealthDashboard — restart força healthy e ignora banner/alertas', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-14T10:00:00.000Z'))
    Chart.mockClear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    wrapper = mount(SystemHealthDashboard)
    await vi.advanceTimersByTimeAsync(2100)
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    window.confirm?.mockRestore?.()
    window.alert?.mockRestore?.()
  })

  it('reiniciar o analysis-service não limpa alertas nem recalcula overallStatus', async () => {
    const analysis = wrapper.vm.services.find((service) => service.id === 'analysis-service')
    expect(analysis).toBeTruthy()

    wrapper.vm.overallStatus.status = 'critical'
    wrapper.vm.overallStatus.title = 'Incidente em andamento'
    wrapper.vm.overallStatus.description = 'Analysis Service degradado'
    const alertCount = wrapper.vm.activeAlerts.length
    const analysisAlerts = wrapper.vm.activeAlerts.filter(
      (alert) => alert.service === 'analysis-service'
    )
    expect(analysisAlerts.length).toBeGreaterThan(0)

    wrapper.vm.restartService(analysis)

    expect(analysis.status).toBe('restarting')
    expect(wrapper.vm.overallStatus.status).toBe('critical')
    expect(wrapper.vm.activeAlerts).toHaveLength(alertCount)

    await vi.advanceTimersByTimeAsync(3000)
    await flushPromises()

    expect(analysis.status).toBe('healthy')
    expect(wrapper.vm.overallStatus.status).toBe('critical')
    expect(wrapper.vm.overallStatus.title).toBe('Incidente em andamento')
    expect(wrapper.vm.overallStatus.description).toBe('Analysis Service degradado')
    expect(wrapper.vm.activeAlerts).toHaveLength(alertCount)
    expect(
      wrapper.vm.activeAlerts.filter((alert) => alert.service === 'analysis-service')
    ).toHaveLength(analysisAlerts.length)
  })

  it('recusar o confirm não agenda restart nem altera o banner', () => {
    window.confirm.mockReturnValueOnce(false)
    const auth = wrapper.vm.services.find((service) => service.id === 'auth-service')
    const statusBefore = auth.status
    wrapper.vm.overallStatus.status = 'warning'

    wrapper.vm.restartService(auth)

    expect(auth.status).toBe(statusBefore)
    expect(window.alert).not.toHaveBeenCalled()
    expect(wrapper.vm.overallStatus.status).toBe('warning')
  })
})
