import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import Chart from 'chart.js/auto'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard — status restarting não tem classe de card', () => {
  let wrapper
  const source = readFileSync(
    resolve(process.cwd(), 'src/components/SystemHealthDashboard.vue'),
    'utf8'
  )

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T10:00:00.000Z'))
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

  it('restart aplica classe restarting, mas o CSS só pinta healthy/warning/critical', async () => {
    const auth = wrapper.vm.services.find((service) => service.id === 'auth-service')
    expect(auth).toBeTruthy()

    wrapper.vm.restartService(auth)
    await wrapper.vm.$nextTick()

    expect(auth.status).toBe('restarting')
    expect(wrapper.vm.getStatusLabel('restarting')).toBe('Reiniciando')
    expect(window.alert).toHaveBeenCalledWith('Reiniciando Auth Service...')

    const card = wrapper.findAll('.service-card').find((node) => node.classes().includes('restarting'))
    expect(card).toBeTruthy()
    expect(card.classes()).toContain('restarting')
    expect(card.classes()).not.toContain('healthy')
    expect(card.classes()).not.toContain('warning')
    expect(card.classes()).not.toContain('critical')
    expect(card.find('.service-status-indicator').classes()).toContain('restarting')

    expect(source).toContain('.service-card.healthy')
    expect(source).toContain('.service-card.warning')
    expect(source).toContain('.service-card.critical')
    expect(source).toContain('.service-status-indicator.healthy')
    expect(source).not.toMatch(/\.service-card\.restarting\b/)
    expect(source).not.toMatch(/\.service-status-indicator\.restarting\b/)
  })

  it('getStatusLabel conhece restarting, mas o banner overall só trata healthy/warning', () => {
    expect(wrapper.vm.getStatusLabel('restarting')).toBe('Reiniciando')
    expect(wrapper.vm.getStatusLabel('healthy')).toBe('Saudável')
    expect(wrapper.vm.getStatusLabel('warning')).toBe('Atenção')
    expect(wrapper.vm.getStatusLabel('critical')).toBe('Crítico')

    expect(source).toContain("overallStatus.status === 'healthy'")
    expect(source).toContain("overallStatus.status === 'warning'")
    expect(source).not.toContain("overallStatus.status === 'restarting'")
  })
})
