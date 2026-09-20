import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Metas from '@/views/Metas.vue'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/metas', name: 'Metas', component: { template: '<div />' } }]
})

describe('Metas — datas inválidas e moeda NaN', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-20T10:00:00.000Z'))

    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })
    vi.advanceTimersByTime(1000)
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('getTimeRemaining sem targetDate lança ao formatar distância', () => {
    expect(() =>
      wrapper.vm.getTimeRemaining({ status: 'active' })
    ).toThrow()
  })

  it('getTimeRemaining com data inválida lança em vez de degradar', () => {
    expect(() =>
      wrapper.vm.getTimeRemaining({
        status: 'active',
        targetDate: 'not-a-date'
      })
    ).toThrow()
  })

  it('formatDate com string inválida lança RangeError (date-fns)', () => {
    expect(() => wrapper.vm.formatDate('not-a-date')).toThrow()
  })

  it('formatCurrency(NaN) vaza "NaN" na UI de metas', () => {
    expect(wrapper.vm.formatCurrency(Number.NaN)).toMatch(/NaN/)
  })

  it('isOverdue sem targetDate não lança (Invalid Date no isBefore)', () => {
    expect(wrapper.vm.isOverdue({ status: 'active' })).toBe(false)
  })
})
