import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — Backtest só alerta e não persiste resultado', () => {
  let wrapper

  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('backtestMethodology alerta e deixa performance, testResults e a lista iguais', () => {
    const value = wrapper.vm.savedMethodologies.find((item) => item.name === 'Value Conservador')
    const performanceBefore = value.performance
    const countBefore = wrapper.vm.savedMethodologies.length

    expect(value.status).toBe('active')
    expect(wrapper.vm.testResults).toBeNull()

    wrapper.vm.backtestMethodology(value)

    expect(window.alert).toHaveBeenCalledWith('Iniciando backtest para: Value Conservador')
    expect(value.performance).toBe(performanceBefore)
    expect(value.status).toBe('active')
    expect(wrapper.vm.testResults).toBeNull()
    expect(wrapper.vm.isTestRunning).toBe(false)
    expect(wrapper.vm.savedMethodologies).toHaveLength(countBefore)
    expect(wrapper.vm.savedMethodologies.find((item) => item.name === 'Value Conservador')).toBe(value)
  })

  it('o wizard não expõe execução real de backtest — só o alerta', () => {
    expect(typeof wrapper.vm.backtestMethodology).toBe('function')
    expect(typeof wrapper.vm.runBacktest).toBe('undefined')
    expect(typeof wrapper.vm.getBacktesting).toBe('undefined')

    const growth = wrapper.vm.savedMethodologies.find((item) => item.name === 'Growth Agressivo')
    wrapper.vm.backtestMethodology(growth)

    expect(window.alert).toHaveBeenCalledTimes(1)
    expect(growth.performance).toBe(0.2847)
    expect(wrapper.vm.testResults).toBeNull()
  })
})
