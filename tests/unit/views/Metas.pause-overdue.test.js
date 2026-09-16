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

describe('Metas — pausa de concluída, atraso e duplicação', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    mockToast.success.mockClear()

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

  it('pausar meta concluída com data passada faz isOverdue voltar a ser true', () => {
    const completed = wrapper.vm.goals.find((goal) => goal.status === 'completed')
    expect(completed).toBeTruthy()
    expect(wrapper.vm.isOverdue(completed)).toBe(false)
    expect(wrapper.vm.getTimeRemaining(completed)).toBe('Concluída')

    const completedCountBefore = wrapper.vm.completedGoals
    const totalTargetBefore = wrapper.vm.totalTargetValue

    wrapper.vm.pauseGoal(completed)

    const updated = wrapper.vm.goals.find((goal) => goal.id === completed.id)
    expect(updated.status).toBe('paused')
    expect(wrapper.vm.isOverdue(updated)).toBe(true)
    expect(wrapper.vm.getTimeRemaining(updated)).toBe('Atrasada')
    expect(wrapper.vm.completedGoals).toBe(completedCountBefore - 1)
    expect(wrapper.vm.totalTargetValue).toBe(totalTargetBefore + updated.targetValue)
    expect(mockToast.success).toHaveBeenCalledWith('Meta pausada')
  })

  it('retomar meta pausada atrasada não restaura o status de concluída', () => {
    const completed = wrapper.vm.goals.find((goal) => goal.status === 'completed')
    wrapper.vm.pauseGoal(completed)
    wrapper.vm.resumeGoal(completed)

    const updated = wrapper.vm.goals.find((goal) => goal.id === completed.id)
    expect(updated.status).toBe('active')
    expect(updated.status).not.toBe('completed')
    expect(wrapper.vm.isOverdue(updated)).toBe(true)
    expect(mockToast.success).toHaveBeenCalledWith('Meta retomada')
  })

  it('duplicar meta concluída com data passada cria cópia ativa já atrasada', () => {
    const completed = wrapper.vm.goals.find((goal) => goal.status === 'completed')
    const countBefore = wrapper.vm.goals.length

    wrapper.vm.duplicateGoal(completed)

    expect(wrapper.vm.goals).toHaveLength(countBefore + 1)
    const copy = wrapper.vm.goals.find((goal) => goal.title === `${completed.title} (Cópia)`)
    expect(copy).toMatchObject({
      status: 'active',
      currentValue: 0,
      targetDate: completed.targetDate,
      targetValue: completed.targetValue
    })
    expect(copy.id).not.toBe(completed.id)
    expect(wrapper.vm.isOverdue(copy)).toBe(true)
    expect(wrapper.vm.getTimeRemaining(copy)).toBe('Atrasada')
  })

  it('validateGoal rejeita data objetivo no passado', () => {
    wrapper.vm.goalForm.title = 'Nova reserva'
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.targetDate = '2020-01-01'

    expect(wrapper.vm.validateGoal()).toBe(false)
    expect(wrapper.vm.goalErrors.targetDate).toBe('Data objetivo deve ser futura')
  })

  it('mudar filtro de status reseta a paginação para a primeira página', async () => {
    wrapper.vm.currentPage = 3
    wrapper.vm.selectedStatusFilter = 'paused'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentPage).toBe(1)
  })
})
