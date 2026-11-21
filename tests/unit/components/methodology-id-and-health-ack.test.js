import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('chart.js/auto', () => {
  const Chart = vi.fn().mockImplementation(() => ({ destroy: vi.fn() }))
  return { default: Chart }
})

import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

describe('CustomMethodologyBuilder: save após edit reutiliza id', () => {
  let wrapper
  let alertSpy

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
    alertSpy.mockRestore()
  })

  it('editMethodology + saveMethodology espalha o id original depois de Date.now()', () => {
    const original = wrapper.vm.savedMethodologies[0]
    const originalId = original.id
    const countBefore = wrapper.vm.savedMethodologies.length

    wrapper.vm.editMethodology(original)
    expect(wrapper.vm.methodology.id).toBe(originalId)

    wrapper.vm.saveMethodology()

    const saved = wrapper.vm.savedMethodologies
    expect(saved.length).toBe(countBefore + 1)
    expect(saved.filter(m => m.id === originalId).length).toBe(2)
  })

  it('reset após save não limpa riskManagement aninhado', () => {
    wrapper.vm.methodology.riskManagement.globalStopLoss = 12
    wrapper.vm.methodology.riskManagement.maxPositionSize = 40
    wrapper.vm.methodology.name = 'Teste'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'desc'

    wrapper.vm.saveMethodology()

    expect(wrapper.vm.methodology.name).toBe('')
    expect(wrapper.vm.methodology.entryRules).toEqual([])
    expect(wrapper.vm.methodology.riskManagement.globalStopLoss).toBe(12)
    expect(wrapper.vm.methodology.riskManagement.maxPositionSize).toBe(40)
  })
})

describe('SystemHealthDashboard: reconhecer alerta não remove da lista', () => {
  let wrapper
  let confirmSpy

  beforeEach(() => {
    vi.useFakeTimers()
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    document.querySelector = vi.fn(() => ({
      getContext: () => ({}),
      scrollIntoView: vi.fn()
    }))
    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    confirmSpy.mockRestore()
  })

  it('acknowledgeAlert só seta flag e o alerta continua em activeAlerts', async () => {
    const before = wrapper.vm.activeAlerts.length
    const alert = wrapper.vm.activeAlerts[0]

    wrapper.vm.acknowledgeAlert(alert)
    await flushPromises()

    expect(alert.acknowledged).toBe(true)
    expect(wrapper.vm.activeAlerts.length).toBe(before)
    expect(wrapper.vm.activeAlerts.some(a => a.id === alert.id)).toBe(true)
    expect(wrapper.text()).toContain(alert.title)
  })

  it('viewLogs filtra por service.id slug — logs com o mesmo slug continuam visíveis', async () => {
    const analysis = wrapper.vm.services.find(s => s.id === 'analysis-service')
    wrapper.vm.viewLogs(analysis)
    await flushPromises()

    expect(wrapper.vm.selectedLogService).toBe('analysis-service')
    expect(wrapper.vm.filteredLogs.every(l => l.service === 'analysis-service')).toBe(true)
    expect(wrapper.vm.filteredLogs.length).toBeGreaterThan(0)
  })
})
