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

describe('Metas — editar meta atrasada ou concluída não persiste', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-18T12:00:00.000Z'))
    setActivePinia(createPinia())
    mockToast.success.mockClear()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/metas', name: 'Metas', component: Metas }]
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

  it('Reserva de Emergência (alvo 2024-12-31) está atrasada e active', () => {
    const reserve = wrapper.vm.goals.find((goal) => goal.title === 'Reserva de Emergência')

    expect(reserve.status).toBe('active')
    expect(wrapper.vm.isOverdue(reserve)).toBe(true)
    expect(wrapper.vm.getTimeRemaining(reserve)).toBe('Atrasada')
  })

  it('edit+save de meta atrasada falha na data e não muda título nem aportes', async () => {
    const reserve = wrapper.vm.goals.find((goal) => goal.title === 'Reserva de Emergência')
    const contributionBefore = reserve.monthlyContribution

    wrapper.vm.editGoal(reserve)
    wrapper.vm.goalForm.title = 'Reserva atualizada'
    wrapper.vm.goalForm.monthlyContribution = 2500

    expect(wrapper.vm.showEditModal).toBe(true)
    expect(wrapper.vm.validateGoal()).toBe(false)
    expect(wrapper.vm.goalErrors.targetDate).toBe('Data objetivo deve ser futura')

    await wrapper.vm.saveGoal()

    const after = wrapper.vm.goals.find((goal) => goal.id === 2)
    expect(after.title).toBe('Reserva de Emergência')
    expect(after.monthlyContribution).toBe(contributionBefore)
    expect(after.status).toBe('active')
    expect(wrapper.vm.showEditModal).toBe(true)
    expect(mockToast.success).not.toHaveBeenCalled()
  })

  it('edit+save de meta concluída com data passada também é no-op', async () => {
    const trip = wrapper.vm.goals.find((goal) => goal.title === 'Viagem Europa')

    expect(trip.status).toBe('completed')
    expect(wrapper.vm.isOverdue(trip)).toBe(false)

    wrapper.vm.editGoal(trip)
    wrapper.vm.goalForm.title = 'Viagem Ásia'
    wrapper.vm.goalForm.description = 'Reabrir destino'

    await wrapper.vm.saveGoal()

    const after = wrapper.vm.goals.find((goal) => goal.id === 3)
    expect(after.title).toBe('Viagem Europa')
    expect(after.description).toBe('Lua de mel na Europa por 15 dias')
    expect(after.status).toBe('completed')
    expect(wrapper.vm.completedGoals).toBe(1)
    expect(mockToast.success).not.toHaveBeenCalled()
  })
})
