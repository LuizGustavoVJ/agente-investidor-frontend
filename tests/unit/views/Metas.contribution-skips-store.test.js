import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Metas from '@/views/Metas.vue'
import { usePortfolioStore } from '@/stores/portfolio'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Metas — aporte só muta o mock local e não persiste na store', () => {
  let wrapper
  let portfolioStore

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T10:00:00.000Z'))
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
    vi.spyOn(portfolioStore, 'updateGoal')
    vi.spyOn(portfolioStore, 'createGoal')
    vi.spyOn(portfolioStore, 'fetchGoals')

    mockToast.success.mockReset()
    mockToast.error.mockReset()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/metas', name: 'Metas', component: { template: '<div />' } }
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
  })

  it('submitContribution incrementa currentValue local e não chama updateGoal', async () => {
    const goal = wrapper.vm.goals[0]
    const before = goal.currentValue

    wrapper.vm.selectedGoal = goal
    wrapper.vm.contributionForm = {
      amount: 1500,
      date: '2026-10-05',
      note: 'aporte extra'
    }

    await wrapper.vm.submitContribution()
    await flushPromises()

    expect(portfolioStore.updateGoal).not.toHaveBeenCalled()
    expect(portfolioStore.createGoal).not.toHaveBeenCalled()
    expect(portfolioStore.fetchGoals).not.toHaveBeenCalled()
    expect(portfolioStore.goals).toEqual([])
    expect(wrapper.vm.goals[0].currentValue).toBe(before + 1500)
    expect(wrapper.vm.goals[0].status).toBe('active')
    expect(mockToast.success).toHaveBeenCalledWith('Aporte adicionado com sucesso!')
  })

  it('aporte que atinge o alvo marca completed só no mock — store continua vazia', async () => {
    const reserva = wrapper.vm.goals.find((goal) => goal.id === 2)
    wrapper.vm.selectedGoal = reserva
    wrapper.vm.contributionForm = {
      amount: 2000,
      date: '2026-10-05',
      note: 'fecha a reserva'
    }

    await wrapper.vm.submitContribution()
    await flushPromises()

    expect(portfolioStore.updateGoal).not.toHaveBeenCalled()
    expect(portfolioStore.goals).toEqual([])
    expect(wrapper.vm.goals.find((goal) => goal.id === 2).status).toBe('completed')
    expect(mockToast.success).toHaveBeenCalledWith('🎉 Parabéns! Meta concluída!')
  })
})
