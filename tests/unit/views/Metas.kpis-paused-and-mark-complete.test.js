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

describe('Metas — KPI de objetivo e conclusão fabricam números', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-09T10:00:00.000Z'))

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/metas', name: 'Metas', component: { template: '<div />' } },
        { path: '/metas/:id', name: 'MetaDetalhe', component: { template: '<div />' } }
      ]
    })
    await router.push('/metas')
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

  it('objetivo total inclui metas pausadas e canceladas — só exclui completed', async () => {
    wrapper.vm.goals = [
      {
        id: 1,
        title: 'Ativa',
        description: 'conta',
        status: 'active',
        category: 'house',
        targetValue: 100000,
        currentValue: 10000,
        targetDate: '2027-01-01'
      },
      {
        id: 2,
        title: 'Pausada',
        description: 'não deveria contar',
        status: 'paused',
        category: 'car',
        targetValue: 40000,
        currentValue: 5000,
        targetDate: '2027-06-01'
      },
      {
        id: 3,
        title: 'Cancelada',
        description: 'não deveria contar',
        status: 'cancelled',
        category: 'travel',
        targetValue: 25000,
        currentValue: 0,
        targetDate: '2026-12-01'
      },
      {
        id: 4,
        title: 'Concluída',
        description: 'excluída',
        status: 'completed',
        category: 'emergency',
        targetValue: 8000,
        currentValue: 8000,
        targetDate: '2026-01-01'
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.totalTargetValue).toBe(165000)
    expect(wrapper.vm.activeGoals).toBe(1)
  })

  it('marcar como concluída força currentValue = targetValue mesmo com 30% do alvo', async () => {
    const house = wrapper.vm.goals.find((g) => g.title === 'Casa Própria')
    expect(house.currentValue).toBe(45000)
    expect(house.targetValue).toBe(150000)
    expect(house.status).toBe('active')

    await wrapper.vm.markAsCompleted(house)

    const updated = wrapper.vm.goals.find((g) => g.id === house.id)
    expect(updated.status).toBe('completed')
    expect(updated.currentValue).toBe(150000)
    expect(updated.currentValue).not.toBe(45000)
    expect(mockToast.success).toHaveBeenCalled()
  })

  it('marcar concluída com overshoot reduz o valor atual até o alvo', async () => {
    wrapper.vm.goals = [
      {
        id: 99,
        title: 'Reserva extra',
        description: 'já passou do alvo',
        status: 'active',
        category: 'emergency',
        targetValue: 30000,
        currentValue: 38500,
        targetDate: '2026-12-31'
      }
    ]
    await wrapper.vm.$nextTick()

    await wrapper.vm.markAsCompleted(wrapper.vm.goals[0])

    expect(wrapper.vm.goals[0].currentValue).toBe(30000)
    expect(wrapper.vm.goals[0].status).toBe('completed')
  })

  it('duplicar meta concluída e atrasada reativa com currentValue 0 e continua isOverdue', async () => {
    const completed = wrapper.vm.goals.find((g) => g.status === 'completed')
    expect(completed.targetDate.startsWith('2024')).toBe(true)

    const beforeCount = wrapper.vm.goals.length
    await wrapper.vm.duplicateGoal(completed)

    expect(wrapper.vm.goals.length).toBe(beforeCount + 1)
    const copy = wrapper.vm.goals[wrapper.vm.goals.length - 1]
    expect(copy.status).toBe('active')
    expect(copy.currentValue).toBe(0)
    expect(copy.targetDate).toBe(completed.targetDate)
    expect(copy.title).toContain('(Cópia)')
    expect(wrapper.vm.isOverdue(copy)).toBe(true)
    expect(wrapper.vm.activeGoals).toBe(3)
  })
})
