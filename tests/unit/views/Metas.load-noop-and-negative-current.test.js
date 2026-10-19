import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Metas from '@/views/Metas.vue'
import { usePortfolioStore } from '@/stores/portfolio'
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

vi.mock('@/api/portfolio', () => ({
  portfolioAPI: {
    getGoals: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn()
  }
}))

describe('Metas — load não busca API, hasError nunca liga e currentValue negativo passa', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T12:00:00.000Z'))
    setActivePinia(createPinia())
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    portfolioAPI.getGoals.mockClear()

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

  it('loadGoalsData só espera 1s — não chama getGoals e hasError continua false', () => {
    expect(portfolioAPI.getGoals).not.toHaveBeenCalled()
    expect(wrapper.vm.hasError).toBe(false)
    expect(wrapper.find('.error-container').exists()).toBe(false)
    expect(wrapper.vm.goals).toHaveLength(3)
    expect(wrapper.vm.goals.map((goal) => goal.title)).toEqual([
      'Casa Própria',
      'Reserva de Emergência',
      'Viagem Europa'
    ])
  })

  it('retryLoad após esvaziar a lista não recupera as metas mockadas', async () => {
    wrapper.vm.goals.splice(0, wrapper.vm.goals.length)
    expect(wrapper.vm.goals).toHaveLength(0)

    const retry = wrapper.vm.retryLoad()
    await vi.advanceTimersByTimeAsync(1000)
    await retry
    await wrapper.vm.$nextTick()

    expect(portfolioAPI.getGoals).not.toHaveBeenCalled()
    expect(wrapper.vm.goals).toHaveLength(0)
    expect(wrapper.vm.hasError).toBe(false)
    expect(wrapper.vm.isInitialLoading).toBe(false)
  })

  it('validateGoal aceita currentValue negativo e o save persiste progresso abaixo de zero', async () => {
    const house = wrapper.vm.goals.find((goal) => goal.title === 'Casa Própria')

    wrapper.vm.editGoal(house)
    wrapper.vm.goalForm.currentValue = -5000

    expect(wrapper.vm.validateGoal()).toBe(true)
    expect(wrapper.vm.goalErrors.currentValue).toBeUndefined()

    await wrapper.vm.saveGoal()

    const after = wrapper.vm.goals.find((goal) => goal.id === 1)
    expect(after.currentValue).toBe(-5000)
    expect(after.status).toBe('active')
    expect(wrapper.vm.getProgressPercentage(after)).toBe(-3)
    expect(mockToast.success).toHaveBeenCalledWith('Meta atualizada com sucesso!')
  })

  it('a store de portfolio permanece vazia — a view não hidrata metas da API', () => {
    const portfolioStore = usePortfolioStore()
    expect(portfolioStore.goals).toEqual([])
    expect(typeof wrapper.vm.loadGoalsData).toBe('function')
    expect(wrapper.vm.goals[0].title).toBe('Casa Própria')
  })
})
