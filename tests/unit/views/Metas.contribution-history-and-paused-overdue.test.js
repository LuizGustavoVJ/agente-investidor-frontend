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

describe('Metas: aporte descarta data/nota e pausada conta como atrasada', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-25T15:00:00.000Z'))
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

  it('submitContribution só soma currentValue — date e note do formulário desaparecem', async () => {
    const goal = wrapper.vm.goals[0]
    const previousValue = goal.currentValue

    wrapper.vm.selectedGoal = goal
    wrapper.vm.contributionForm.amount = 500
    wrapper.vm.contributionForm.date = '2026-11-20'
    wrapper.vm.contributionForm.note = 'Aporte extra de novembro'

    await wrapper.vm.submitContribution()
    await flushPromises()

    const updated = wrapper.vm.goals.find((item) => item.id === goal.id)
    expect(updated.currentValue).toBe(previousValue + 500)
    expect(updated).not.toHaveProperty('contributions')
    expect(updated).not.toHaveProperty('notes')
    expect(updated.lastContributionDate).toBeUndefined()
    expect(updated.lastContributionNote).toBeUndefined()
    expect(JSON.stringify(updated)).not.toContain('Aporte extra de novembro')
    expect(JSON.stringify(updated)).not.toContain('2026-11-20')
  })

  it('isOverdue e o filtro "overdue" incluem meta pausada com data no passado', () => {
    wrapper.vm.goals.push({
      id: 99,
      title: 'Carro pausado',
      description: 'Meta pausada mas já vencida',
      category: 'car',
      targetValue: 40000,
      currentValue: 5000,
      startDate: '2024-01-01',
      targetDate: '2025-01-01',
      monthlyContribution: 500,
      status: 'paused'
    })

    const paused = wrapper.vm.goals.find((item) => item.id === 99)
    expect(wrapper.vm.isOverdue(paused)).toBe(true)
    expect(wrapper.vm.getTimeRemaining(paused)).toBe('Atrasada')

    wrapper.vm.selectedStatusFilter = 'overdue'
    const overdueIds = wrapper.vm.filteredGoals.map((item) => item.id)
    expect(overdueIds).toContain(99)
  })
})
