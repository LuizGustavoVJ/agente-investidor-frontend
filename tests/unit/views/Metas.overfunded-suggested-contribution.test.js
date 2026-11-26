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

describe('Metas: aporte sugerido negativo, pausada e NaN', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-26T15:00:00.000Z'))
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

  it('getSuggestedContribution devolve valor negativo quando currentValue já passou o alvo', () => {
    const overfundedPast = {
      targetValue: 10000,
      currentValue: 15000,
      targetDate: '2025-01-01'
    }
    const overfundedFuture = {
      targetValue: 12000,
      currentValue: 18000,
      targetDate: '2028-11-26'
    }

    expect(wrapper.vm.getSuggestedContribution(overfundedPast)).toBe(-5000)
    expect(wrapper.vm.getSuggestedContribution(overfundedFuture)).toBeLessThan(0)
  })

  it('getSuggestedContribution ignora status — meta pausada ou concluída ainda recebe valor', () => {
    const paused = {
      status: 'paused',
      targetValue: 10000,
      currentValue: 4000,
      targetDate: '2028-11-26'
    }
    const completed = {
      status: 'completed',
      targetValue: 10000,
      currentValue: 10000,
      targetDate: '2025-01-01'
    }

    expect(wrapper.vm.getSuggestedContribution(paused)).toBeGreaterThan(0)
    expect(wrapper.vm.getSuggestedContribution(completed)).toBe(0)
  })

  it('formatCurrency(NaN) não usa o fallback de nulo e averageProgress ignora pausadas', () => {
    expect(wrapper.vm.formatCurrency(null)).toBe('R$ 0,00')
    expect(wrapper.vm.formatCurrency(NaN)).not.toBe('R$ 0,00')
    expect(wrapper.vm.formatCurrency(NaN)).toMatch(/NaN/i)

    wrapper.vm.goals = [
      {
        id: 1,
        title: 'Ativa 50%',
        status: 'active',
        targetValue: 100,
        currentValue: 50,
        targetDate: '2028-01-01'
      },
      {
        id: 2,
        title: 'Pausada 100%',
        status: 'paused',
        targetValue: 100,
        currentValue: 100,
        targetDate: '2028-01-01'
      }
    ]

    expect(wrapper.vm.averageProgress).toBe(50)
  })
})
