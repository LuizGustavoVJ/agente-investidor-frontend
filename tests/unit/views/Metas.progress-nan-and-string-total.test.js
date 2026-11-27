import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

import Metas from '@/views/Metas.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/metas/:id', component: { template: '<div />' } }
  ]
})

describe('Metas: progresso NaN, total concatenado e remaining inválido', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-27T15:00:00.000Z'))
    toast.success.mockClear()
    toast.error.mockClear()

    wrapper = mount(Metas, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })
    await router.isReady()
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('getProgressPercentage com currentValue undefined devolve NaN', () => {
    const goal = { targetValue: 10000, currentValue: undefined, status: 'active' }
    expect(wrapper.vm.getProgressPercentage(goal)).toBeNaN()
  })

  it('averageProgress vira NaN se uma meta ativa não tem currentValue', () => {
    wrapper.vm.goals = [
      {
        id: 1,
        title: 'Sem valor',
        status: 'active',
        targetValue: 10000,
        currentValue: undefined,
        targetDate: '2028-01-01'
      }
    ]

    expect(wrapper.vm.averageProgress).toBeNaN()
  })

  it('totalTargetValue concatena quando targetValue é string', () => {
    wrapper.vm.goals = [
      { id: 1, status: 'active', targetValue: '10000', currentValue: 0, targetDate: '2028-01-01' },
      { id: 2, status: 'paused', targetValue: 5000, currentValue: 0, targetDate: '2028-01-01' }
    ]

    expect(wrapper.vm.totalTargetValue).toBe('0100005000')
  })

  it('getTimeRemaining com data inválida lança (date-fns não aceita Invalid Date)', () => {
    const goal = { status: 'active', targetDate: 'not-a-date' }

    expect(() => wrapper.vm.getTimeRemaining(goal)).toThrow()
  })
})
