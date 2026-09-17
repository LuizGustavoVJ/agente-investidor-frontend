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

describe('Metas — aporte sugerido, conclusão e paginação', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-17T12:00:00.000Z'))
    setActivePinia(createPinia())
    mockToast.success.mockClear()
    mockToast.error.mockClear()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/metas', name: 'Metas', component: Metas },
        { path: '/metas/:id', name: 'MetaDetalhe', component: { template: '<div />' } }
      ]
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

  it('getSuggestedContribution devolve o restante de uma vez quando a meta já venceu', () => {
    const overdue = wrapper.vm.goals.find((goal) => goal.id === 2)

    expect(wrapper.vm.isOverdue(overdue)).toBe(true)
    expect(wrapper.vm.getSuggestedContribution(overdue)).toBe(
      overdue.targetValue - overdue.currentValue
    )
  })

  it('getSuggestedContribution devolve valor negativo se o atual já passou do alvo', () => {
    const overfunded = {
      targetValue: 30000,
      currentValue: 35000,
      targetDate: '2024-12-31',
      status: 'active'
    }

    expect(wrapper.vm.getSuggestedContribution(overfunded)).toBe(-5000)
  })

  it('getSimulatedContribution divide o restante pelos meses e arredonda para cima', () => {
    wrapper.vm.goalForm.targetValue = 10001
    wrapper.vm.goalForm.currentValue = 0
    wrapper.vm.goalForm.targetDate = '2026-12-17T12:00:00.000Z'

    const months = wrapper.vm.getMonthsToTarget()
    expect(months).toBeGreaterThan(0)
    expect(wrapper.vm.getSimulatedContribution()).toBe(Math.ceil(10001 / months))
    expect(wrapper.vm.getSimulatedContribution()).not.toBe(Math.floor(10001 / months))
  })

  it('getMonthsToTarget sem data devolve 0 e a simulação vira o restante bruto', () => {
    wrapper.vm.goalForm.targetValue = 8000
    wrapper.vm.goalForm.currentValue = 2000
    wrapper.vm.goalForm.targetDate = ''

    expect(wrapper.vm.getMonthsToTarget()).toBe(0)
    expect(wrapper.vm.getSimulatedContribution()).toBe(6000)
  })

  it('markAsCompleted zera o excesso e iguala currentValue ao alvo', () => {
    wrapper.vm.goals.push({
      id: 99,
      title: 'Meta estourada',
      targetValue: 10000,
      currentValue: 12500,
      targetDate: '2026-12-31',
      status: 'active'
    })

    wrapper.vm.markAsCompleted(wrapper.vm.goals.find((goal) => goal.id === 99))

    const updated = wrapper.vm.goals.find((goal) => goal.id === 99)
    expect(updated.status).toBe('completed')
    expect(updated.currentValue).toBe(10000)
    expect(updated.currentValue).toBeLessThan(12500)
    expect(wrapper.vm.isOverdue(updated)).toBe(false)
  })

  it('addContribution com monthlyContribution 0 pré-preenche amount 0 e a validação recusa', () => {
    const withoutMonthly = wrapper.vm.goals.find((goal) => goal.monthlyContribution === 0)

    wrapper.vm.addContribution(withoutMonthly)

    expect(wrapper.vm.contributionForm.amount).toBe(0)
    expect(wrapper.vm.validateContribution()).toBe(false)
    expect(wrapper.vm.contributionErrors.amount).toBe('Valor deve ser maior que zero')
  })

  it('excluir o último item da página não reseta currentPage e a lista paginada fica vazia', () => {
    wrapper.vm.goalsPerPage = 1
    wrapper.vm.currentPage = 3
    expect(wrapper.vm.totalPages).toBe(3)
    expect(wrapper.vm.paginatedGoals).toHaveLength(1)

    const lastOnPage = wrapper.vm.paginatedGoals[0]
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    wrapper.vm.deleteGoal(lastOnPage)

    expect(wrapper.vm.currentPage).toBe(3)
    expect(wrapper.vm.totalPages).toBe(2)
    expect(wrapper.vm.filteredGoals.length).toBeGreaterThan(0)
    expect(wrapper.vm.paginatedGoals).toHaveLength(0)
  })

  it('getProgressClass usa os limiares 25/50/75/100', () => {
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 0 })).toBe('poor')
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 25 })).toBe('fair')
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 50 })).toBe('good')
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 75 })).toBe('excellent')
    expect(wrapper.vm.getProgressClass({ targetValue: 100, currentValue: 100 })).toBe('completed')
  })
})
