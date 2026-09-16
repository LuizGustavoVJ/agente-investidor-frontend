import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => {
  function MockChart() {
    this.destroy = () => {}
    this.update = () => {}
    this.data = { datasets: [] }
    this.options = {}
  }
  return { default: MockChart }
})

describe('SystemHealthDashboard — alertas, logs e status', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('acknowledgeAlert só marca o alerta e não o remove da lista', () => {
    const alert = wrapper.vm.activeAlerts[0]
    const countBefore = wrapper.vm.activeAlerts.length

    wrapper.vm.acknowledgeAlert(alert)

    expect(alert.acknowledged).toBe(true)
    expect(wrapper.vm.activeAlerts).toHaveLength(countBefore)
    expect(wrapper.vm.activeAlerts.find((item) => item.id === alert.id)).toBeTruthy()
  })

  it('resolveAlert remove o alerta da lista ativa', () => {
    const alert = wrapper.vm.activeAlerts[0]
    const id = alert.id
    const countBefore = wrapper.vm.activeAlerts.length

    wrapper.vm.resolveAlert(alert)

    expect(wrapper.vm.activeAlerts).toHaveLength(countBefore - 1)
    expect(wrapper.vm.activeAlerts.find((item) => item.id === id)).toBeUndefined()
  })

  it('filteredLogs respeita nível e serviço', () => {
    wrapper.vm.selectedLogLevel = 'error'
    wrapper.vm.selectedLogService = 'all'
    expect(wrapper.vm.filteredLogs.every((log) => log.level === 'error')).toBe(true)
    expect(wrapper.vm.filteredLogs.length).toBeGreaterThan(0)

    wrapper.vm.selectedLogLevel = 'all'
    wrapper.vm.selectedLogService = 'auth-service'
    expect(wrapper.vm.filteredLogs.every((log) => log.service === 'auth-service')).toBe(true)
  })

  it('getStatusLabel cobre os estados operacionais e devolve o original se for desconhecido', () => {
    expect(wrapper.vm.getStatusLabel('healthy')).toBe('Saudável')
    expect(wrapper.vm.getStatusLabel('warning')).toBe('Atenção')
    expect(wrapper.vm.getStatusLabel('critical')).toBe('Crítico')
    expect(wrapper.vm.getStatusLabel('restarting')).toBe('Reiniciando')
    expect(wrapper.vm.getStatusLabel('degraded')).toBe('degraded')
  })

  it('restartService só altera o status depois da confirmação e agenda o retorno a healthy', async () => {
    const service = wrapper.vm.services[0]
    window.confirm.mockReturnValueOnce(false)

    wrapper.vm.restartService(service)
    expect(service.status).not.toBe('restarting')
    expect(window.alert).not.toHaveBeenCalled()

    window.confirm.mockReturnValueOnce(true)
    wrapper.vm.restartService(service)
    expect(service.status).toBe('restarting')
    expect(window.alert).toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(3000)
    expect(service.status).toBe('healthy')
  })
})
