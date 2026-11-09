import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Metas from '@/views/Metas.vue'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }]
})

describe('Metas — progresso, filtros e validação', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    wrapper = mount(Metas, {
      global: {
        plugins: [createPinia(), router],
        stubs: { 'router-link': true }
      }
    })
    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('calcula progresso limitado a 100% e trata meta zerada', () => {
    expect(wrapper.vm.getProgressPercentage({ currentValue: 45, targetValue: 150 })).toBe(30)
    expect(wrapper.vm.getProgressPercentage({ currentValue: 200, targetValue: 100 })).toBe(100)
    expect(wrapper.vm.getProgressPercentage({ currentValue: 10, targetValue: 0 })).toBe(0)
    expect(wrapper.vm.getProgressPercentage(null)).toBe(0)
    expect(wrapper.vm.getProgressPercentage({ currentValue: -10, targetValue: 100 })).toBe(-10)
  })

  it('classifica o progresso em faixas de risco', () => {
    expect(wrapper.vm.getProgressClass({ currentValue: 100, targetValue: 100 })).toBe('completed')
    expect(wrapper.vm.getProgressClass({ currentValue: 80, targetValue: 100 })).toBe('excellent')
    expect(wrapper.vm.getProgressClass({ currentValue: 50, targetValue: 100 })).toBe('good')
    expect(wrapper.vm.getProgressClass({ currentValue: 25, targetValue: 100 })).toBe('fair')
    expect(wrapper.vm.getProgressClass({ currentValue: 10, targetValue: 100 })).toBe('poor')
  })

  it('não considera meta concluída como atrasada', () => {
    expect(wrapper.vm.isOverdue({
      status: 'completed',
      targetDate: '2020-01-01'
    })).toBe(false)
  })

  it('marca meta ativa com data passada como atrasada', () => {
    expect(wrapper.vm.isOverdue({
      status: 'active',
      targetDate: '2020-01-01'
    })).toBe(true)
  })

  it('filtra metas por busca, status e categoria', async () => {
    wrapper.vm.searchTerm = 'europa'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredGoals).toHaveLength(1)
    expect(wrapper.vm.filteredGoals[0].title).toBe('Viagem Europa')

    wrapper.vm.searchTerm = ''
    wrapper.vm.selectedStatusFilter = 'completed'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredGoals.every(g => g.status === 'completed')).toBe(true)

    wrapper.vm.selectedStatusFilter = 'all'
    wrapper.vm.selectedCategoryFilter = 'emergency'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredGoals).toHaveLength(1)
    expect(wrapper.vm.filteredGoals[0].category).toBe('emergency')
  })

  it('filtro overdue usa isOverdue e não o status textual', async () => {
    wrapper.vm.goals.push({
      id: 99,
      title: 'Meta vencida',
      description: 'atrasada',
      category: 'other',
      targetValue: 1000,
      currentValue: 10,
      targetDate: '2020-01-01',
      status: 'active'
    })
    wrapper.vm.selectedStatusFilter = 'overdue'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.filteredGoals.some(g => g.id === 99)).toBe(true)
    expect(wrapper.vm.filteredGoals.every(g => wrapper.vm.isOverdue(g))).toBe(true)
  })

  it('exclui metas concluídas do valor objetivo total', () => {
    const incompleteTotal = wrapper.vm.goals
      .filter(g => g.status !== 'completed')
      .reduce((sum, g) => sum + g.targetValue, 0)

    expect(wrapper.vm.totalTargetValue).toBe(incompleteTotal)
  })

  it('validateGoal exige título, valor positivo e data futura', () => {
    wrapper.vm.goalForm = {
      title: '   ',
      targetValue: 0,
      targetDate: '',
      currentValue: 0,
      monthlyContribution: 0
    }

    expect(wrapper.vm.validateGoal()).toBe(false)
    expect(wrapper.vm.goalErrors.title).toBe('Título é obrigatório')
    expect(wrapper.vm.goalErrors.targetValue).toBe('Valor objetivo deve ser maior que zero')
    expect(wrapper.vm.goalErrors.targetDate).toBe('Data objetivo é obrigatória')

    wrapper.vm.goalForm.title = 'Reserva'
    wrapper.vm.goalForm.targetValue = 1000
    wrapper.vm.goalForm.targetDate = '2020-01-01'

    expect(wrapper.vm.validateGoal()).toBe(false)
    expect(wrapper.vm.goalErrors.targetDate).toBe('Data objetivo deve ser futura')
  })

  it('validateContribution rejeita valor zero ou negativo', () => {
    wrapper.vm.contributionForm.amount = 0
    expect(wrapper.vm.validateContribution()).toBe(false)
    expect(wrapper.vm.contributionErrors.amount).toBe('Valor deve ser maior que zero')
  })

  it('formatCurrency trata nulo como zero em reais', () => {
    const normalize = (value) => value.replace(/\u00a0/g, ' ')
    expect(normalize(wrapper.vm.formatCurrency(null))).toBe('R$ 0,00')
    expect(normalize(wrapper.vm.formatCurrency(1500))).toBe('R$ 1.500,00')
  })
})
