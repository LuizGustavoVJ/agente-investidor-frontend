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

describe('Metas — data e nota do aporte são descartadas', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-11T10:00:00.000Z'))

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
      ]
    })
    await router.push('/dashboard')
    await router.isReady()

    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('submitContribution soma o valor e ignora date/note — a meta não guarda ledger', async () => {
    const goal = {
      id: 20,
      title: 'Reserva',
      description: 'emergência',
      category: 'emergency',
      targetValue: 10000,
      currentValue: 4000,
      startDate: '2025-01-01',
      targetDate: '2027-12-31',
      monthlyContribution: 500,
      status: 'active'
    }
    wrapper.vm.goals = [goal]
    wrapper.vm.selectedGoal = goal
    wrapper.vm.contributionForm.amount = 750
    wrapper.vm.contributionForm.date = '2026-09-15'
    wrapper.vm.contributionForm.note = 'bônus trimestral'
    await wrapper.vm.$nextTick()

    await wrapper.vm.submitContribution()
    await flushPromises()

    expect(wrapper.vm.goals[0].currentValue).toBe(4750)
    expect(wrapper.vm.goals[0].status).toBe('active')
    expect(wrapper.vm.goals[0].contributions).toBeUndefined()
    expect(wrapper.vm.goals[0].lastContributionDate).toBeUndefined()
    expect(wrapper.vm.goals[0].lastContributionNote).toBeUndefined()
    expect(wrapper.vm.goals[0].note).toBeUndefined()
    expect(wrapper.vm.goals[0]).not.toHaveProperty('date')
  })

  it('aporte acima do alvo devolve contribuição sugerida negativa', () => {
    const overshot = {
      targetValue: 10000,
      currentValue: 12500,
      targetDate: '2027-12-31'
    }

    expect(wrapper.vm.getSuggestedContribution(overshot)).toBeLessThan(0)
  })
})
