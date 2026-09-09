import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Metas from '@/views/Metas.vue'
import { usePortfolioStore } from '@/stores/portfolio'

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getGoals: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn()
  }
}))

import { portfolioAPI } from '@/api/portfolio'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/metas/:id', name: 'MetaDetalhe', component: { template: '<div />' } }
  ]
})

describe('Metas — persistência local e atraso de meta pausada', () => {
  let wrapper
  let portfolioStore

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'))
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
    vi.spyOn(portfolioStore, 'createGoal')
    vi.spyOn(portfolioStore, 'updateGoal')
    vi.spyOn(portfolioStore, 'deleteGoal')
    vi.spyOn(portfolioStore, 'fetchGoals')

    wrapper = mount(Metas, {
      global: {
        plugins: [router]
      }
    })

    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.vm.$nextTick()
    mockToast.success.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('cria meta só em memória, sem chamar a store nem a API de portfolio', async () => {
    const totalBefore = wrapper.vm.goals.length

    wrapper.vm.goalForm = {
      title: 'Aposentadoria',
      description: 'Reserva de longo prazo',
      category: 'retirement',
      targetValue: 500000,
      currentValue: 0,
      targetDate: '2035-01-01',
      monthlyContribution: 2000
    }

    await wrapper.vm.saveGoal()

    expect(wrapper.vm.goals).toHaveLength(totalBefore + 1)
    expect(wrapper.vm.goals.at(-1).title).toBe('Aposentadoria')
    expect(wrapper.vm.goals.at(-1).status).toBe('active')
    expect(portfolioStore.createGoal).not.toHaveBeenCalled()
    expect(portfolioAPI.createGoal).not.toHaveBeenCalled()
    expect(portfolioStore.fetchGoals).not.toHaveBeenCalled()
  })

  it('exclui meta localmente sem DELETE na API', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const goal = wrapper.vm.goals[0]
    const totalBefore = wrapper.vm.goals.length

    await wrapper.vm.deleteGoal(goal)

    expect(wrapper.vm.goals).toHaveLength(totalBefore - 1)
    expect(wrapper.vm.goals.find((item) => item.id === goal.id)).toBeUndefined()
    expect(portfolioStore.deleteGoal).not.toHaveBeenCalled()
    expect(portfolioAPI.deleteGoal).not.toHaveBeenCalled()
  })

  it('meta pausada com data no passado continua atrasada', () => {
    const pausedOverdue = {
      id: 99,
      status: 'paused',
      targetDate: '2020-01-01'
    }

    expect(wrapper.vm.isOverdue(pausedOverdue)).toBe(true)
    expect(wrapper.vm.getTimeRemaining(pausedOverdue)).toBe('Atrasada')
  })
})
