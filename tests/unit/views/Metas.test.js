import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

import Metas from '@/views/Metas.vue'

describe('Metas financeiras', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-16T12:00:00.000Z'))
    wrapper = mount(Metas, {
      global: {
        stubs: {
          'router-link': true
        }
      }
    })
    wrapper.vm.isInitialLoading = false
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('cap progress em 100% mesmo com overshoot e devolve 0 se targetValue é 0', () => {
    expect(wrapper.vm.getProgressPercentage({ currentValue: 25000, targetValue: 25000 })).toBe(100)
    expect(wrapper.vm.getProgressPercentage({ currentValue: 40000, targetValue: 25000 })).toBe(100)
    expect(wrapper.vm.getProgressPercentage({ currentValue: 10, targetValue: 0 })).toBe(0)
    expect(wrapper.vm.getProgressPercentage(null)).toBe(0)
  })

  it('não marca meta concluída como atrasada mesmo com data no passado', () => {
    const completed = wrapper.vm.goals.find((g) => g.status === 'completed')

    expect(wrapper.vm.isOverdue(completed)).toBe(false)
    expect(wrapper.vm.getTimeRemaining(completed)).toBe('Concluída')
  })

  it('filtra overdue só com metas ativas/pausadas cuja data já passou', async () => {
    wrapper.vm.selectedStatusFilter = 'overdue'
    await wrapper.vm.$nextTick()

    const overdueTitles = wrapper.vm.filteredGoals.map((g) => g.title)
    expect(overdueTitles).toContain('Reserva de Emergência')
    expect(overdueTitles).not.toContain('Viagem Europa')
    expect(overdueTitles).not.toContain('Casa Própria')
  })

  it('busca por título ignora maiúsculas e reseta a página', async () => {
    wrapper.vm.currentPage = 3
    wrapper.vm.searchTerm = 'CASA'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.filteredGoals).toHaveLength(1)
    expect(wrapper.vm.filteredGoals[0].title).toBe('Casa Própria')
    expect(wrapper.vm.currentPage).toBe(1)
  })

  it('validateGoal recusa data passada, título em branco e valor zero', () => {
    Object.assign(wrapper.vm.goalForm, {
      title: '   ',
      description: '',
      category: 'house',
      targetValue: 0,
      currentValue: 0,
      targetDate: '2020-01-01',
      monthlyContribution: 0
    })

    expect(wrapper.vm.validateGoal()).toBe(false)
    expect(wrapper.vm.goalErrors.title).toBe('Título é obrigatório')
    expect(wrapper.vm.goalErrors.targetValue).toBe('Valor objetivo deve ser maior que zero')
    expect(wrapper.vm.goalErrors.targetDate).toBe('Data objetivo deve ser futura')
  })

  it('aporte em meta atrasada sugere o valor restante inteiro', () => {
    const overdue = wrapper.vm.goals.find((g) => g.title === 'Reserva de Emergência')

    expect(wrapper.vm.getSuggestedContribution(overdue)).toBe(1500)
  })

  it('saveGoal recusa persistir quando a validação falha', async () => {
    const before = wrapper.vm.goals.length
    wrapper.vm.goalForm.title = ''
    wrapper.vm.goalForm.targetValue = 1000
    wrapper.vm.goalForm.targetDate = '2027-01-01'

    await wrapper.vm.saveGoal()

    expect(wrapper.vm.goals).toHaveLength(before)
    expect(mockToast.success).not.toHaveBeenCalled()
  })

  it('totalTargetValue ignora metas concluídas', () => {
    const completed = wrapper.vm.goals.find((g) => g.status === 'completed')

    const expected = wrapper.vm.goals
      .filter((g) => g.status !== 'completed')
      .reduce((sum, goal) => sum + goal.targetValue, 0)

    expect(wrapper.vm.totalTargetValue).toBe(expected)
    expect(wrapper.vm.totalTargetValue).toBeLessThan(expected + completed.targetValue)
  })
})
