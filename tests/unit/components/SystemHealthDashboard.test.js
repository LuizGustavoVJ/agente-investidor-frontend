import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard', () => {
  let wrapper
  let confirmSpy
  let alertSpy

  const mountDashboard = async ({ advanceRefresh = false } = {}) => {
    wrapper = mount(SystemHealthDashboard)
    if (advanceRefresh) {
      await vi.advanceTimersByTimeAsync(2000)
      await flushPromises()
    }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    Element.prototype.scrollIntoView = vi.fn()
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    try {
      wrapper?.unmount()
    } catch {
      // Chart.js pode não ter sido inicializado nos testes
    }
    wrapper = null
    vi.clearAllTimers()
    vi.useRealTimers()
    Math.random.mockRestore?.()
    confirmSpy?.mockRestore()
    alertSpy?.mockRestore()
  })

  it('renderiza status geral, serviços e infraestrutura', async () => {
    await mountDashboard()

    expect(wrapper.text()).toContain('System Health Dashboard')
    expect(wrapper.text()).toContain('Sistema Operacional')
    expect(wrapper.text()).toContain('Auth Service')
    expect(wrapper.text()).toContain('Analysis Service')
    expect(wrapper.text()).toContain('PostgreSQL')
    expect(wrapper.text()).toContain('Redis Cache')
  })

  it('desabilita o botão enquanto o refresh está em andamento', async () => {
    await mountDashboard()

    const button = wrapper.find('.refresh-btn')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toContain('Atualizando...')

    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    expect(wrapper.find('.refresh-btn').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.refresh-btn').text()).toContain('Atualizar')
  })

  it('traduz labels de status', async () => {
    await mountDashboard()

    expect(wrapper.vm.getStatusLabel('healthy')).toBe('Saudável')
    expect(wrapper.vm.getStatusLabel('warning')).toBe('Atenção')
    expect(wrapper.vm.getStatusLabel('critical')).toBe('Crítico')
    expect(wrapper.vm.getStatusLabel('restarting')).toBe('Reiniciando')
    expect(wrapper.vm.getStatusLabel('desconhecido')).toBe('desconhecido')
  })

  it('formata números no padrão pt-BR', async () => {
    await mountDashboard()
    expect(wrapper.vm.formatNumber(1250)).toMatch(/1\.250/)
    expect(wrapper.vm.formatNumber(125430)).toMatch(/125\.430/)
  })

  it('filtra logs por nível e por serviço', async () => {
    await mountDashboard()

    expect(wrapper.findAll('.log-item')).toHaveLength(5)

    await wrapper.find('.log-level-select').setValue('error')
    expect(wrapper.findAll('.log-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('Failed to connect to external API')

    await wrapper.find('.log-level-select').setValue('all')
    await wrapper.find('.log-service-select').setValue('auth-service')
    expect(wrapper.findAll('.log-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('User authentication successful')

    await wrapper.find('.log-level-select').setValue('debug')
    await wrapper.find('.log-service-select').setValue('auth-service')
    expect(wrapper.findAll('.log-item')).toHaveLength(0)
  })

  it('reconhece alerta sem removê-lo e resolve removendo da lista', async () => {
    await mountDashboard()

    expect(wrapper.findAll('.alert-item')).toHaveLength(3)

    const firstAlert = wrapper.vm.activeAlerts[0]
    await wrapper.findAll('.alert-btn.ack')[0].trigger('click')
    expect(firstAlert.acknowledged).toBe(true)
    expect(wrapper.findAll('.alert-item')).toHaveLength(3)

    await wrapper.findAll('.alert-btn.resolve')[0].trigger('click')
    expect(wrapper.findAll('.alert-item')).toHaveLength(2)
    expect(wrapper.vm.activeAlerts.find((alert) => alert.id === firstAlert.id)).toBeUndefined()
  })

  it('ao ver logs, filtra pelo serviço e rola até a lista', async () => {
    await mountDashboard()

    const dataService = wrapper.vm.services.find((service) => service.id === 'data-service')
    const logsColumn = { scrollIntoView: vi.fn() }
    vi.spyOn(document, 'querySelector').mockReturnValue(logsColumn)

    wrapper.vm.viewLogs(dataService)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedLogService).toBe('data-service')
    expect(logsColumn.scrollIntoView).toHaveBeenCalled()
    expect(wrapper.findAll('.log-item').length).toBeGreaterThan(0)
    wrapper.findAll('.log-item').forEach((item) => {
      expect(item.text()).toContain('data-service')
    })
    document.querySelector.mockRestore()
  })

  it('não reinicia serviço se o usuário cancelar o confirm', async () => {
    confirmSpy.mockReturnValue(false)
    await mountDashboard()

    const service = wrapper.vm.services[0]
    const originalStatus = service.status
    wrapper.vm.restartService(service)

    expect(alertSpy).not.toHaveBeenCalled()
    expect(service.status).toBe(originalStatus)
  })

  it('marca serviço como restarting e volta para healthy após o timeout', async () => {
    await mountDashboard()

    const service = wrapper.vm.services[0]
    wrapper.vm.restartService(service)

    expect(confirmSpy).toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalled()
    expect(service.status).toBe('restarting')

    await vi.advanceTimersByTimeAsync(3000)
    expect(service.status).toBe('healthy')
    expect(service.cpu).toBeLessThanOrEqual(30)
    expect(service.memory).toBeLessThanOrEqual(50)
  })

  it('classifica serviço como critical quando CPU/memória/latência estouram o limiar', async () => {
    Math.random.mockReturnValue(1)
    await mountDashboard({ advanceRefresh: true })

    const analysis = wrapper.vm.services.find((service) => service.id === 'analysis-service')
    expect(analysis.status).toBe('critical')
    expect(analysis.cpu).toBeGreaterThan(80)
  })

  it('mantém métricas de CPU/memória entre 0 e 100 após o refresh', async () => {
    Math.random.mockReturnValue(1)
    await mountDashboard({ advanceRefresh: true })

    wrapper.vm.mainMetrics.forEach((metric) => {
      expect(Number(metric.currentValue)).toBeGreaterThanOrEqual(0)
      expect(Number(metric.currentValue)).toBeLessThanOrEqual(100)
    })
  })

  it('aplica classes de SLA quando disponibilidade e error rate violam o target', async () => {
    await mountDashboard()

    wrapper.vm.slaMetrics.availability = 98.5
    wrapper.vm.slaMetrics.errorRate = 1.5
    wrapper.vm.slaMetrics.responseTime = 600
    wrapper.vm.slaMetrics.throughput = 400
    await wrapper.vm.$nextTick()

    const slaValues = wrapper.findAll('.sla-value')
    expect(slaValues[0].classes()).toContain('critical')
    expect(slaValues[1].classes()).toContain('critical')
    expect(slaValues[2].classes()).toContain('critical')
    expect(slaValues[3].classes()).toContain('critical')
  })

  it('limpa o interval de auto-refresh no unmount', async () => {
    const clearSpy = vi.spyOn(global, 'clearInterval')
    await mountDashboard()
    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalled()
    wrapper = null
    clearSpy.mockRestore()
  })
})
