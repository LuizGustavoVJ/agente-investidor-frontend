import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Metas from '@/views/Metas.vue'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Metas: métricas, mutação e persistência local', () => {
  let wrapper
  let router
  let confirmSpy

  beforeEach(async () => {
    vi.useFakeTimers()
    toast.success.mockReset()
    toast.error.mockReset()
    toast.info.mockReset()
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]
    })
    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
    confirmSpy.mockRestore()
    vi.useRealTimers()
  })

  it('completedGoals conta todas as concluídas, não só as deste ano', () => {
    wrapper.vm.goals.push({
      id: 99,
      title: 'Meta antiga',
      category: 'travel',
      targetValue: 1000,
      currentValue: 1000,
      startDate: '2020-01-01',
      targetDate: '2021-01-01',
      status: 'completed'
    })

    expect(wrapper.vm.completedGoals).toBe(2)
    expect(wrapper.text()).toContain('este ano')
  })

  it('duplicateGoal copia targetDate e pode nascer atrasada', () => {
    const overdue = {
      id: 50,
      title: 'Atrasada',
      category: 'car',
      targetValue: 10000,
      currentValue: 1000,
      targetDate: '2020-01-01',
      monthlyContribution: 100,
      status: 'active'
    }
    wrapper.vm.goals.push(overdue)

    wrapper.vm.duplicateGoal(overdue)

    const copy = wrapper.vm.goals.find(g => g.title === 'Atrasada (Cópia)')
    expect(copy.status).toBe('active')
    expect(copy.targetDate).toBe('2020-01-01')
    expect(copy.currentValue).toBe(0)
    expect(wrapper.vm.isOverdue(copy)).toBe(true)
  })

  it('markAsCompleted força currentValue = targetValue', () => {
    const goal = wrapper.vm.goals.find(g => g.status === 'active')
    goal.currentValue = 10
    const target = goal.targetValue

    wrapper.vm.markAsCompleted(goal)

    const updated = wrapper.vm.goals.find(g => g.id === goal.id)
    expect(updated.status).toBe('completed')
    expect(updated.currentValue).toBe(target)
  })

  it('validateContribution aceita data vazia', () => {
    wrapper.vm.contributionForm.amount = 100
    wrapper.vm.contributionForm.date = ''

    expect(wrapper.vm.validateContribution()).toBe(true)
    expect(wrapper.vm.contributionErrors.date).toBeUndefined()
  })

  it('validateGoal não exige categoria', () => {
    wrapper.vm.goalForm.title = 'Sem categoria'
    wrapper.vm.goalForm.targetValue = 5000
    wrapper.vm.goalForm.targetDate = '2099-12-31'
    wrapper.vm.goalForm.category = ''

    expect(wrapper.vm.validateGoal()).toBe(true)
  })

  it('loadGoalsData só espera 1s e não toca a API de portfolio', async () => {
    wrapper.vm.isInitialLoading = true
    const load = wrapper.vm.loadGoalsData()
    await vi.advanceTimersByTimeAsync(1000)
    await load
    expect(wrapper.vm.isInitialLoading).toBe(false)
    expect(wrapper.vm.hasError).toBe(false)
  })
})
