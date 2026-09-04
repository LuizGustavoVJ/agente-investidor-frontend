import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { addMonths, format } from 'date-fns'
import Metas from '@/views/Metas.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/metas', name: 'Metas', component: Metas },
    { path: '/metas/:id', name: 'MetaDetalhe', component: { template: '<div />' } }
  ]
})

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Metas — conclusão, exclusão, progresso e aporte sugerido', () => {
  let wrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    wrapper = mount(Metas, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.restoreAllMocks()
  })

  it('marca meta como concluída preenchendo o valor atual com o objetivo', () => {
    const goal = wrapper.vm.goals.find((g) => g.status === 'active')
    const target = goal.targetValue

    wrapper.vm.markAsCompleted(goal)

    const updated = wrapper.vm.goals.find((g) => g.id === goal.id)
    expect(updated.status).toBe('completed')
    expect(updated.currentValue).toBe(target)
    expect(mockToast.success).toHaveBeenCalledWith('🎉 Meta marcada como concluída!')
  })

  it('exclui meta só após confirmação', () => {
    const goal = wrapper.vm.goals[0]
    const id = goal.id
    const initialCount = wrapper.vm.goals.length

    window.confirm.mockReturnValueOnce(false)
    wrapper.vm.deleteGoal(goal)
    expect(wrapper.vm.goals).toHaveLength(initialCount)

    window.confirm.mockReturnValueOnce(true)
    wrapper.vm.deleteGoal(goal)
    expect(wrapper.vm.goals.find((g) => g.id === id)).toBeUndefined()
    expect(mockToast.success).toHaveBeenCalledWith('Meta excluída')
  })

  it('limita progresso a 0 quando o objetivo é zero e a 100 quando já passou do alvo', () => {
    expect(wrapper.vm.getProgressPercentage({ currentValue: 50, targetValue: 0 })).toBe(0)
    expect(wrapper.vm.getProgressPercentage({ currentValue: 150, targetValue: 100 })).toBe(100)
    expect(wrapper.vm.getProgressPercentage(null)).toBe(0)
  })

  it('classifica faixa de progresso', () => {
    expect(wrapper.vm.getProgressClass({ currentValue: 100, targetValue: 100 })).toBe('completed')
    expect(wrapper.vm.getProgressClass({ currentValue: 80, targetValue: 100 })).toBe('excellent')
    expect(wrapper.vm.getProgressClass({ currentValue: 50, targetValue: 100 })).toBe('good')
    expect(wrapper.vm.getProgressClass({ currentValue: 30, targetValue: 100 })).toBe('fair')
    expect(wrapper.vm.getProgressClass({ currentValue: 10, targetValue: 100 })).toBe('poor')
  })

  it('sugere o valor restante quando não há meses até o alvo', () => {
    const overdue = {
      targetValue: 10000,
      currentValue: 2500,
      targetDate: '2020-01-01'
    }

    expect(wrapper.vm.getSuggestedContribution(overdue)).toBe(7500)
  })

  it('estima data de conclusão a partir do aporte mensal e informa ausência de aportes', () => {
    wrapper.vm.goalForm.targetValue = 12000
    wrapper.vm.goalForm.currentValue = 0
    wrapper.vm.goalForm.monthlyContribution = 0
    expect(wrapper.vm.getCompletionDate()).toBe('Sem aportes')

    wrapper.vm.goalForm.monthlyContribution = 1000
    const expected = format(addMonths(new Date(), 12), 'MM/yyyy')
    expect(wrapper.vm.getCompletionDate()).toBe(expected)
  })

  it('pagina a lista filtrada', () => {
    wrapper.vm.goalsPerPage = 2
    wrapper.vm.currentPage = 2
    wrapper.vm.selectedStatusFilter = 'all'
    wrapper.vm.searchTerm = ''

    expect(wrapper.vm.paginatedGoals.length).toBeLessThanOrEqual(2)
    expect(wrapper.vm.totalPages).toBe(Math.ceil(wrapper.vm.filteredGoals.length / 2))
  })
})
