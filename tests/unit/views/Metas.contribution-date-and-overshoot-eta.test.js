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

describe('Metas: data de aporte sem validação e ETA no passado', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-24T15:00:00.000Z'))
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

  it('validateContribution aceita data futura e data vazia — só checa amount', () => {
    wrapper.vm.contributionForm.amount = 500
    wrapper.vm.contributionForm.date = '2099-01-01'

    expect(wrapper.vm.validateContribution()).toBe(true)
    expect(wrapper.vm.contributionErrors.date).toBeUndefined()

    wrapper.vm.contributionForm.date = ''
    expect(wrapper.vm.validateContribution()).toBe(true)
    expect(wrapper.vm.contributionErrors).toEqual({})
  })

  it('getCompletionDate com currentValue > targetValue devolve mês no passado', () => {
    wrapper.vm.goalForm.targetValue = 1000
    wrapper.vm.goalForm.currentValue = 5000
    wrapper.vm.goalForm.monthlyContribution = 1000

    expect(wrapper.vm.getCompletionDate()).toBe('07/2026')
  })
})
