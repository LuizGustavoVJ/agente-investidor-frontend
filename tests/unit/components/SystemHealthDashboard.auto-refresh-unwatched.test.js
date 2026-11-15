import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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

describe('SystemHealthDashboard — auto-refresh e formatTime sem guarda', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-15T10:00:00.000Z'))
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
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
    Math.random.mockRestore?.()
  })

  it('não importa watch do Vue — o checkbox só faz v-model e watchAutoRefresh nunca é ligado', () => {
    const script = source.slice(source.indexOf('<script>'), source.indexOf('</script>'))

    expect(script).toMatch(/import \{ ref, reactive, computed, onMounted, onUnmounted \} from 'vue'/)
    expect(script).not.toMatch(/\bwatch\b/)
    expect(source).toMatch(/v-model="autoRefresh"/)
    expect(source).toMatch(/const watchAutoRefresh = \(\) => \{\s*startAutoRefresh\(\)/)
    expect(source).not.toMatch(/watch\s*\(\s*autoRefresh/)
    expect(source).not.toMatch(/@change="watchAutoRefresh"|@input="watchAutoRefresh"/)
  })

  it('desmarcar Auto-refresh não para o interval de 30s — lastUpdate continua mudando', async () => {
    wrapper = mount(SystemHealthDashboard)

    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    const afterMount = wrapper.vm.overallStatus.lastUpdate
    expect(wrapper.vm.autoRefresh).toBe(true)

    const checkbox = wrapper.find('.auto-refresh-checkbox')
    expect(checkbox.exists()).toBe(true)
    await checkbox.setValue(false)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.autoRefresh).toBe(false)

    await vi.advanceTimersByTimeAsync(30000)
    await flushPromises()

    expect(wrapper.vm.overallStatus.lastUpdate).not.toBe(afterMount)
    expect(wrapper.vm.autoRefresh).toBe(false)
  })

  it('formatTime com Invalid Date / ISO string lança RangeError — o template chama formatTime nos logs', () => {
    wrapper = mount(SystemHealthDashboard)

    const fn = source.slice(
      source.indexOf('const formatTime = (date) => {'),
      source.indexOf('const formatNumber = (num) => {')
    )
    expect(fn).toMatch(/Intl\.DateTimeFormat\('pt-BR'/)
    expect(fn).toMatch(/\.format\(date\)/)
    expect(fn).not.toMatch(/instanceof Date|isValid|Number\.isNaN|isNaN\(/)

    expect(source).toMatch(/formatTime\(log\.timestamp\)/)
    expect(source).toMatch(/formatTime\(alert\.timestamp\)/)
    expect(source).toMatch(/formatTime\(overallStatus\.lastUpdate\)/)

    expect(() => wrapper.vm.formatTime(new Date('not-a-date'))).toThrow(RangeError)
    expect(() => wrapper.vm.formatTime('not-a-date')).toThrow(RangeError)
    expect(() => wrapper.vm.formatTime('2024-01-15T12:00:00.000Z')).toThrow(RangeError)
  })
})
