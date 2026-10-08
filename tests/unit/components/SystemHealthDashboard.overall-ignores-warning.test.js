import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard — banner geral ignora serviço em warning/critical', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('analysis-service já nasce em warning mas o status geral continua healthy', () => {
    const analysis = wrapper.vm.services.find((s) => s.id === 'analysis-service')
    expect(analysis.status).toBe('warning')
    expect(wrapper.vm.overallStatus.status).toBe('healthy')
    expect(wrapper.vm.overallStatus.title).toBe('Sistema Operacional')
    expect(wrapper.text()).toContain('Todos os serviços funcionando normalmente')
  })

  it('marcar um serviço como critical não atualiza overallStatus', async () => {
    const analysis = wrapper.vm.services.find((s) => s.id === 'analysis-service')
    analysis.status = 'critical'
    analysis.cpu = 99
    analysis.memory = 95
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.overallStatus.status).toBe('healthy')
    expect(wrapper.find('.status-card.healthy').exists()).toBe(true)
    expect(wrapper.find('.status-card.critical').exists()).toBe(false)
  })
})
