import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder: backtest de alerta e teste rápido sem validade', () => {
  let wrapper
  let alertSpy

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
    alertSpy.mockRestore()
    vi.useRealTimers()
  })

  it('backtestMethodology só alerta — fonte não chama getBacktesting nem analysisAPI', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../src/components/CustomMethodologyBuilder.vue'),
      'utf8'
    )

    expect(source).not.toMatch(/analysisAPI/)
    expect(source).not.toMatch(/getBacktesting/)
    expect(source).toMatch(/alert\(`Iniciando backtest para: \$\{saved\.name\}`\)/)

    wrapper.vm.backtestMethodology({ name: 'Value Conservador' })
    expect(alertSpy).toHaveBeenCalledWith('Iniciando backtest para: Value Conservador')
  })

  it('runQuickTest preenche testResults mesmo com isMethodologyValid false', async () => {
    vi.useFakeTimers()
    expect(wrapper.vm.isMethodologyValid).toBeFalsy()
    expect(wrapper.vm.testResults).toBeNull()

    const pending = wrapper.vm.runQuickTest()
    await vi.advanceTimersByTimeAsync(3000)
    await pending
    await flushPromises()

    expect(wrapper.vm.isMethodologyValid).toBeFalsy()
    expect(wrapper.vm.testResults).toEqual(
      expect.objectContaining({
        totalReturn: expect.any(Number),
        sharpeRatio: expect.any(Number),
        maxDrawdown: expect.any(Number),
        totalTrades: expect.any(Number),
        winRate: expect.any(Number),
        alpha: expect.any(Number)
      })
    )
  })

  it('formatNumber(undefined) lança TypeError — cards de review quebram sem resultado numérico', () => {
    expect(() => wrapper.vm.formatNumber(undefined)).toThrow()
    expect(() => wrapper.vm.formatNumber(null)).toThrow()
    expect(wrapper.vm.formatNumber(1.234)).toBe('1.23')
  })
})
