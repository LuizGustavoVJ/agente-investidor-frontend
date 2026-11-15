import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Chart from 'chart.js/auto'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

const source = readFileSync(
  resolve(__dirname, '../../../src/components/SystemHealthDashboard.vue'),
  'utf8'
)

describe('SystemHealthDashboard — gráficos procuram atributo DOM ref', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    Chart.mockClear()
  })

  afterEach(() => {
    try {
      wrapper?.unmount()
    } catch {
      // Chart.js pode não ter sido inicializado
    }
    wrapper = null
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('o canvas usa ref Vue e createCharts busca [ref=...] no document — o seletor nunca acha o canvas', () => {
    expect(source).toMatch(/<canvas ref="cpuChart"/)
    expect(source).toMatch(/<canvas ref="memoryChart"/)
    expect(source).toMatch(/<canvas ref="requestChart"/)
    expect(source).toMatch(/<canvas ref="responseChart"/)

    const createCharts = source.slice(
      source.indexOf('const createCharts = () => {'),
      source.indexOf('const startAutoRefresh = () => {')
    )

    expect(createCharts).toMatch(/document\.querySelector\('\[ref="cpuChart"\]'\)/)
    expect(createCharts).toMatch(/document\.querySelector\('\[ref="memoryChart"\]'\)/)
    expect(createCharts).toMatch(/document\.querySelector\('\[ref="requestChart"\]'\)/)
    expect(createCharts).toMatch(/document\.querySelector\('\[ref="responseChart"\]'\)/)
    expect(createCharts).not.toMatch(/\$refs|getCurrentInstance/)
  })

  it('diretiva ref não vira atributo HTML — querySelector("[ref=cpuChart]") devolve null com o canvas no DOM', async () => {
    wrapper = mount(SystemHealthDashboard)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('canvas.performance-chart').exists()).toBe(true)
    expect(wrapper.findAll('canvas.performance-chart')).toHaveLength(4)

    const previous = document.body.innerHTML
    document.body.innerHTML = '<canvas class="performance-chart"></canvas>'
    try {
      expect(document.querySelector('[ref="cpuChart"]')).toBeNull()
      expect(document.querySelector('[ref="memoryChart"]')).toBeNull()
      expect(document.querySelector('canvas.performance-chart')).not.toBeNull()
    } finally {
      document.body.innerHTML = previous
    }
  })

  it('setTimeout(createCharts, 100) chama Chart.js com null nos quatro canvas', async () => {
    wrapper = mount(SystemHealthDashboard)
    await vi.advanceTimersByTimeAsync(100)

    expect(Chart).toHaveBeenCalledTimes(4)
    Chart.mock.calls.forEach((call) => {
      expect(call[0]).toBeNull()
    })
  })

  it('unmount antes dos 100ms não cancela o timeout — Chart.js ainda dispara depois de desmontar', async () => {
    wrapper = mount(SystemHealthDashboard)
    wrapper.unmount()
    wrapper = null

    await vi.advanceTimersByTimeAsync(100)

    expect(Chart).toHaveBeenCalled()
    expect(Chart.mock.calls[0][0]).toBeNull()
  })
})
