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

function pausedGoal(overrides = {}) {
  return {
    id: 10,
    title: 'Reserva pausada',
    description: 'não deveria receber aporte',
    category: 'emergency',
    targetValue: 10000,
    currentValue: 9000,
    startDate: '2025-01-01',
    targetDate: '2027-12-31',
    monthlyContribution: 500,
    status: 'paused',
    ...overrides
  }
}

describe('Metas — aporte em pausada/cancelada e detalhes 404', () => {
  let wrapper
  let router

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-10T10:00:00.000Z'))

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
        {
          path: '/:pathMatch(.*)*',
          name: 'Error404',
          component: { template: '<div class="not-found">404</div>' }
        }
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

  it('o botão Aportar só desabilita completed — pausada continua clicável', async () => {
    wrapper.vm.goals = [pausedGoal()]
    await wrapper.vm.$nextTick()

    const contribute = wrapper.find('.contribute-btn')
    expect(contribute.exists()).toBe(true)
    expect(contribute.attributes('disabled')).toBeUndefined()
  })

  it('submitContribution em meta pausada soma o valor e pode marcar completed', async () => {
    const goal = pausedGoal({ currentValue: 9000, targetValue: 10000 })
    wrapper.vm.goals = [goal]
    wrapper.vm.selectedGoal = goal
    wrapper.vm.contributionForm.amount = 1000
    await wrapper.vm.$nextTick()

    await wrapper.vm.submitContribution()
    await flushPromises()

    expect(wrapper.vm.goals[0].currentValue).toBe(10000)
    expect(wrapper.vm.goals[0].status).toBe('completed')
    expect(mockToast.success).toHaveBeenCalled()
  })

  it('submitContribution em meta cancelada também conclui o objetivo', async () => {
    const goal = pausedGoal({
      id: 11,
      title: 'Viagem cancelada',
      status: 'cancelled',
      currentValue: 2000,
      targetValue: 5000
    })
    wrapper.vm.goals = [goal]
    wrapper.vm.selectedGoal = goal
    wrapper.vm.contributionForm.amount = 3000
    await wrapper.vm.$nextTick()

    await wrapper.vm.submitContribution()
    await flushPromises()

    expect(wrapper.vm.goals[0].status).toBe('completed')
    expect(wrapper.vm.goals[0].currentValue).toBe(5000)
  })

  it('viewGoalDetails aponta para /metas/:id, rota ausente no roteador de produção', async () => {
    const metas = router.getRoutes().find((r) => r.path.startsWith('/metas') || r.name === 'Metas')
    expect(metas).toBeUndefined()

    await wrapper.vm.viewGoalDetails({ id: 1, title: 'Casa Própria' })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/metas/1')
    expect(router.currentRoute.value.name).toBe('Error404')
  })

  it('apagar o único item da página 2 deixa currentPage órfão e a grade vazia', async () => {
    wrapper.vm.goalsPerPage = 2
    wrapper.vm.goals = [
      pausedGoal({ id: 1, title: 'A', status: 'active' }),
      pausedGoal({ id: 2, title: 'B', status: 'active' }),
      pausedGoal({ id: 3, title: 'C', status: 'active' })
    ]
    wrapper.vm.currentPage = 2
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.totalPages).toBe(2)
    expect(wrapper.vm.paginatedGoals).toHaveLength(1)

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await wrapper.vm.deleteGoal(wrapper.vm.goals[2])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.goals).toHaveLength(2)
    expect(wrapper.vm.totalPages).toBe(1)
    expect(wrapper.vm.currentPage).toBe(2)
    expect(wrapper.vm.paginatedGoals).toHaveLength(0)
  })
})
