import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

describe('SystemHealthDashboard: restartService é só local', () => {
  let wrapper
  let confirmSpy
  let alertSpy

  beforeEach(() => {
    vi.useFakeTimers()
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper.unmount()
    confirmSpy.mockRestore()
    alertSpy.mockRestore()
    vi.useRealTimers()
  })

  it('marca o serviço como restarting sem chamar API e agenda o status healthy no cliente', () => {
    const service = wrapper.vm.services[0]
    const originalName = service.name
    service.status = 'critical'
    service.cpu = 99

    wrapper.vm.restartService(service)

    expect(confirmSpy).toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith(`Reiniciando ${originalName}...`)
    expect(service.status).toBe('restarting')

    vi.advanceTimersByTime(3000)

    expect(service.status).toBe('healthy')
    expect(service.cpu).toBeGreaterThanOrEqual(0)
    expect(service.cpu).toBeLessThanOrEqual(30)
  })

  it('cancelar o confirm não muda o status', () => {
    confirmSpy.mockReturnValue(false)
    const service = wrapper.vm.services[0]
    service.status = 'critical'

    wrapper.vm.restartService(service)

    expect(service.status).toBe('critical')
    expect(alertSpy).not.toHaveBeenCalled()
  })
})
