import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => {
  const Chart = function ChartMock() {
    return { destroy: vi.fn() }
  }
  return { default: Chart }
})

describe('SystemHealthDashboard — saúde, limiares e auto-refresh', () => {
  let wrapper
  let confirmSpy
  let alertSpy

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-11-18T10:00:00.000Z') })
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    HTMLElement.prototype.scrollIntoView = vi.fn()

    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    confirmSpy?.mockRestore()
    alertSpy?.mockRestore()
    vi.restoreAllMocks()
  })

  it('mantém overallStatus.healthy mesmo com Analysis Service em warning', () => {
    const analysis = wrapper.vm.services.find(s => s.id === 'analysis-service')
    expect(analysis.status).toBe('warning')
    expect(wrapper.vm.overallStatus.status).toBe('healthy')
    expect(wrapper.vm.overallStatus.title).toBe('Sistema Operacional')
  })

  it('não recalcula overallStatus após refresh — só lastUpdate muda', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(1)
    const analysis = wrapper.vm.services.find(s => s.id === 'analysis-service')
    analysis.cpu = 90
    analysis.memory = 90
    analysis.responseTime = 400

    const refresh = wrapper.vm.refreshData()
    await vi.advanceTimersByTimeAsync(2000)
    await refresh

    expect(analysis.status).toBe('critical')
    expect(wrapper.vm.overallStatus.status).toBe('healthy')
  })

  it('aplica limiares de CPU/memória, mas ignora network acima de 80%', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const cpu = wrapper.vm.mainMetrics.find(m => m.id === 'cpu')
    const network = wrapper.vm.mainMetrics.find(m => m.id === 'network')
    cpu.currentValue = '85.0'
    network.currentValue = '90.0'
    network.status = 'healthy'

    const refresh = wrapper.vm.refreshData()
    await vi.advanceTimersByTimeAsync(2000)
    await refresh

    expect(cpu.status).toBe('critical')
    expect(network.status).toBe('healthy')
  })

  it('filtra logs por nível e serviço', () => {
    wrapper.vm.selectedLogLevel = 'error'
    wrapper.vm.selectedLogService = 'analysis-service'

    const logs = wrapper.vm.filteredLogs
    expect(logs.length).toBeGreaterThan(0)
    expect(logs.every(l => l.level === 'error' && l.service === 'analysis-service')).toBe(true)
  })

  it('acknowledgeAlert só marca o alerta localmente, sem persistência', () => {
    const alert = wrapper.vm.activeAlerts[0]
    expect(alert.acknowledged).toBeUndefined()
    wrapper.vm.acknowledgeAlert(alert)
    expect(alert.acknowledged).toBe(true)
    expect(wrapper.vm.activeAlerts).toContain(alert)
  })

  it('resolveAlert usa igualdade estrita de id e não remove 1 vs "1"', () => {
    const originalLength = wrapper.vm.activeAlerts.length
    wrapper.vm.resolveAlert({ id: '1' })
    expect(wrapper.vm.activeAlerts).toHaveLength(originalLength)

    wrapper.vm.resolveAlert({ id: 1 })
    expect(wrapper.vm.activeAlerts).toHaveLength(originalLength - 1)
    expect(wrapper.vm.activeAlerts.find(a => a.id === 1)).toBeUndefined()
  })

  it('viewLogs seleciona o serviço mas quebra se .logs-column não tiver scrollIntoView no document', () => {
    const querySpy = vi.spyOn(document, 'querySelector')
    querySpy.mockReturnValue(null)

    expect(() => wrapper.vm.viewLogs({ id: 'auth-service' })).toThrow()
    expect(wrapper.vm.selectedLogService).toBe('auth-service')
  })

  it('createCharts procura canvas com seletor [ref="cpuChart"], que o Vue nunca emite no DOM', async () => {
    const querySpy = vi.spyOn(document, 'querySelector')
    await vi.advanceTimersByTimeAsync(100)

    const selectors = querySpy.mock.calls.map(call => call[0])
    expect(selectors).toContain('[ref="cpuChart"]')
    expect(selectors).toContain('[ref="memoryChart"]')
    expect(document.querySelector('canvas[ref="cpuChart"]')).toBeNull()
  })

  it('desmarcar auto-refresh no checkbox não para o intervalo — watchAutoRefresh nunca é um watch', async () => {
    const clearSpy = vi.spyOn(global, 'clearInterval')
    const checkbox = wrapper.find('.auto-refresh-checkbox')
    expect(checkbox.exists()).toBe(true)

    await checkbox.setValue(false)
    expect(wrapper.vm.autoRefresh).toBe(false)
    expect(clearSpy).not.toHaveBeenCalled()
  })

  it('restartService marca restarting e volta a healthy só depois de 3s', async () => {
    const service = { name: 'Auth Service', status: 'critical', cpu: 90, memory: 90, responseTime: 400 }
    wrapper.vm.restartService(service)

    expect(confirmSpy).toHaveBeenCalled()
    expect(service.status).toBe('restarting')

    await vi.advanceTimersByTimeAsync(3000)
    expect(service.status).toBe('healthy')
  })
})
