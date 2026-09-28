import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { addMonths, format } from 'date-fns'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

import Metas from '@/views/Metas.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }]
})

describe('Metas — data de conclusão com meta já superada', () => {
  let wrapper
  let timeoutSpy

  beforeEach(async () => {
    timeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((cb) => {
      if (typeof cb === 'function') cb()
      return 0
    })

    wrapper = mount(Metas, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })

    await router.isReady()
  })

  afterEach(() => {
    wrapper.unmount()
    timeoutSpy.mockRestore()
  })

  it('getCompletionDate com currentValue acima do alvo gera meses negativos (data no passado)', () => {
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.currentValue = 15000
    wrapper.vm.goalForm.monthlyContribution = 1000

    const monthsNeeded = Math.ceil((10000 - 15000) / 1000)
    const expected = format(addMonths(new Date(), monthsNeeded), 'MM/yyyy')

    expect(wrapper.vm.getCompletionDate()).toBe(expected)
    expect(monthsNeeded).toBe(-5)
  })

  it('getSuggestedContribution com data alvo no passado devolve o restante (pode ser negativo)', () => {
    const suggested = wrapper.vm.getSuggestedContribution({
      targetValue: 8000,
      currentValue: 10000,
      targetDate: '2020-01-01'
    })

    expect(suggested).toBe(-2000)
  })
})
