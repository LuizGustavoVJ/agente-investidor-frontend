import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard — logs e alertas', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('filtra logs por nível e serviço', async () => {
    const allCount = wrapper.vm.filteredLogs.length

    wrapper.vm.selectedLogLevel = 'error'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredLogs.every(log => log.level === 'error')).toBe(true)
    expect(wrapper.vm.filteredLogs.length).toBeLessThan(allCount)

    wrapper.vm.selectedLogLevel = 'all'
    wrapper.vm.selectedLogService = 'data-service'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredLogs.every(log => log.service === 'data-service')).toBe(true)
  })

  it('acknowledgeAlert marca o alerta sem removê-lo', () => {
    const alert = wrapper.vm.activeAlerts[0]
    const initialCount = wrapper.vm.activeAlerts.length

    wrapper.vm.acknowledgeAlert(alert)

    expect(alert.acknowledged).toBe(true)
    expect(wrapper.vm.activeAlerts).toHaveLength(initialCount)
  })

  it('resolveAlert remove o alerta da lista ativa', () => {
    const alert = wrapper.vm.activeAlerts[0]
    const id = alert.id

    wrapper.vm.resolveAlert(alert)

    expect(wrapper.vm.activeAlerts.find(a => a.id === id)).toBeUndefined()
  })

  it('traduz status operacionais', () => {
    expect(wrapper.vm.getStatusLabel('healthy')).toBe('Saudável')
    expect(wrapper.vm.getStatusLabel('warning')).toBe('Atenção')
    expect(wrapper.vm.getStatusLabel('critical')).toBe('Crítico')
    expect(wrapper.vm.getStatusLabel('restarting')).toBe('Reiniciando')
  })
})
