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

describe('Metas: title null derruba validação/busca e alvo 0 vira 0% (não 100%)', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-28T15:00:00.000Z'))
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

  it('validateGoal chama title.trim() — title null lança TypeError em vez de marcar o campo', () => {
    wrapper.vm.goalForm.title = null
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.targetDate = '2028-01-01'

    expect(() => wrapper.vm.validateGoal()).toThrow()
  })

  it('busca com title null lança ao filtrar — description coberta em outra rodada, title não', () => {
    wrapper.vm.goals = [
      {
        id: 1,
        title: null,
        description: 'Reserva',
        status: 'active',
        category: 'emergency',
        targetValue: 10000,
        currentValue: 0,
        targetDate: '2028-01-01'
      }
    ]
    wrapper.vm.searchTerm = 'reserva'

    expect(() => wrapper.vm.filteredGoals).toThrow()
  })

  it('getProgressPercentage com targetValue 0 devolve 0, não 100 (Dashboard faz o inverso)', () => {
    expect(wrapper.vm.getProgressPercentage({ targetValue: 0, currentValue: 500 })).toBe(0)
    expect(wrapper.vm.getProgressPercentage({ targetValue: 10000, currentValue: 2500 })).toBe(25)
    expect(wrapper.vm.getProgressPercentage({ targetValue: 100, currentValue: 250 })).toBe(100)
  })

  it('getProgressClass usa faixas 25/50/75/100', () => {
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 100 })).toBe('completed')
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 75 })).toBe('excellent')
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 50 })).toBe('good')
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 25 })).toBe('fair')
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 10 })).toBe('poor')
  })
})
