import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
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

describe('Metas — coerção de aporte e progresso', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    mockToast.success.mockReset()
    mockToast.error.mockReset()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/metas', component: { template: '<div />' } }]
    })

    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })

    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('concatena string quando o input number entrega amount como texto', async () => {
    const goal = wrapper.vm.goals[0]
    expect(goal.currentValue).toBe(45000)

    wrapper.vm.selectedGoal = goal
    wrapper.vm.contributionForm.amount = '250'

    await wrapper.vm.submitContribution()

    expect(goal.currentValue).toBe('45000250')
    expect(goal.currentValue).not.toBe(45250)
    expect(typeof goal.currentValue).toBe('string')
  })

  it('aceita amount não numérico na validação e corrompe o saldo', async () => {
    const goal = wrapper.vm.goals[0]
    wrapper.vm.selectedGoal = goal
    wrapper.vm.contributionForm.amount = 'abc'

    expect(wrapper.vm.validateContribution()).toBe(true)

    await wrapper.vm.submitContribution()

    expect(goal.currentValue).toBe('45000abc')
  })

  it('soma corretamente quando amount já é número', async () => {
    const goal = wrapper.vm.goals[0]
    wrapper.vm.selectedGoal = goal
    wrapper.vm.contributionForm.amount = 250

    await wrapper.vm.submitContribution()

    expect(goal.currentValue).toBe(45250)
    expect(goal.status).toBe('active')
  })

  it('getProgressPercentage vira NaN se targetValue ou currentValue vierem ausentes da API', () => {
    expect(
      wrapper.vm.getProgressPercentage({
        title: 'Sem alvo',
        currentValue: 1000
      })
    ).toBeNaN()

    expect(
      wrapper.vm.getProgressPercentage({
        title: 'Sem atual',
        targetValue: 10000
      })
    ).toBeNaN()
  })
})
