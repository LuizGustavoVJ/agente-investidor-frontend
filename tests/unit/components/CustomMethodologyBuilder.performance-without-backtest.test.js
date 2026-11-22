import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder: performance salva sem backtest da API', () => {
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

  it('o fonte do wizard não chama analysisAPI.getBacktesting e runQuickTest usa Math.random + timeout 3000', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../src/components/CustomMethodologyBuilder.vue'),
      'utf8'
    )

    expect(source).not.toMatch(/analysisAPI/)
    expect(source).not.toMatch(/getBacktesting/)
    expect(source).not.toMatch(/@\/api\/analysis/)
    expect(source).toMatch(/Math\.random\(\)/)
    expect(source).toMatch(/setTimeout\(resolve,\s*3000\)/)
    expect(source).toMatch(/performance:\s*testResults\.value \? testResults\.value\.totalReturn : 0/)
  })

  it('saveMethodology persiste testResults.totalReturn como performance sem chamar backtest', () => {
    Object.assign(wrapper.vm.methodology, {
      name: 'Value stub',
      category: 'value',
      description: 'estratégia local',
      riskProfile: 'conservative',
      timeHorizon: 'long'
    })
    wrapper.vm.testResults = { totalReturn: 0.1847, sharpeRatio: 1.2 }

    const before = wrapper.vm.savedMethodologies.length
    wrapper.vm.saveMethodology()

    expect(wrapper.vm.savedMethodologies).toHaveLength(before + 1)
    const saved = wrapper.vm.savedMethodologies[wrapper.vm.savedMethodologies.length - 1]
    expect(saved.performance).toBe(0.1847)
    expect(saved.name).toBe('Value stub')
    expect(saved.status).toBe('active')
    expect(alertSpy).toHaveBeenCalledWith('Metodologia salva com sucesso!')
  })

  it('saveMethodology sem teste grava performance 0 — o card parece um backtest zerado', () => {
    Object.assign(wrapper.vm.methodology, {
      name: 'Sem teste',
      category: 'growth',
      description: 'sem quick test',
      riskProfile: 'aggressive',
      timeHorizon: 'short'
    })
    wrapper.vm.testResults = null

    wrapper.vm.saveMethodology()

    const saved = wrapper.vm.savedMethodologies.find(m => m.name === 'Sem teste')
    expect(saved.performance).toBe(0)
  })
})
