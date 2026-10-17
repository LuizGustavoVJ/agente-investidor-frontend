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

describe('Metas — criar com currentValue acima do alvo permanece active', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-17T12:00:00.000Z'))
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

  it('validateGoal aceita currentValue maior que o alvo — não exige categoria nem conclusão', () => {
    wrapper.vm.goalForm.title = 'Reserva já feita'
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.currentValue = 16000
    wrapper.vm.goalForm.targetDate = '2027-06-01'
    wrapper.vm.goalForm.category = ''

    expect(wrapper.vm.validateGoal()).toBe(true)
    expect(wrapper.vm.goalErrors.currentValue).toBeUndefined()
    expect(wrapper.vm.goalErrors.category).toBeUndefined()
  })

  it('saveGoal cria meta active com progresso 100% e não conta em completedGoals', async () => {
    const completedBefore = wrapper.vm.completedGoals
    const activeBefore = wrapper.vm.activeGoals
    const totalBefore = wrapper.vm.totalGoals

    expect(completedBefore).toBe(1)
    expect(activeBefore).toBe(2)

    wrapper.vm.goalForm.title = 'Reserva já feita'
    wrapper.vm.goalForm.description = 'Patrimônio já cobre o alvo'
    wrapper.vm.goalForm.category = 'emergency'
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.currentValue = 16000
    wrapper.vm.goalForm.targetDate = '2027-06-01'
    wrapper.vm.goalForm.monthlyContribution = 0

    await wrapper.vm.saveGoal()

    const created = wrapper.vm.goals.find((goal) => goal.title === 'Reserva já feita')

    expect(created).toBeTruthy()
    expect(created.status).toBe('active')
    expect(created.currentValue).toBe(16000)
    expect(created.targetValue).toBe(10000)
    expect(wrapper.vm.getProgressPercentage(created)).toBe(100)
    expect(wrapper.vm.completedGoals).toBe(completedBefore)
    expect(wrapper.vm.activeGoals).toBe(activeBefore + 1)
    expect(wrapper.vm.totalGoals).toBe(totalBefore + 1)
    expect(wrapper.vm.averageProgress).toBe(75)
    expect(mockToast.success).toHaveBeenCalledWith('Meta criada com sucesso!')
  })
})
