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

describe('Metas — saveGoal não persiste na portfolioStore', () => {
  let wrapper
  let portfolioStore

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-04T10:00:00.000Z'))
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
    vi.spyOn(portfolioStore, 'createGoal')
    vi.spyOn(portfolioStore, 'updateGoal')
    vi.spyOn(portfolioStore, 'fetchGoals')

    mockToast.success.mockReset()
    mockToast.error.mockReset()

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
  })

  it('cria meta só no mock local e não chama createGoal da store', async () => {
    const countBefore = wrapper.vm.goals.length

    wrapper.vm.goalForm = {
      title: 'Aposentadoria',
      description: 'Reserva de longo prazo',
      category: 'retirement',
      targetValue: 500000,
      currentValue: 0,
      targetDate: '2030-12-31',
      monthlyContribution: 2000
    }

    await wrapper.vm.saveGoal()
    await flushPromises()

    expect(portfolioStore.createGoal).not.toHaveBeenCalled()
    expect(portfolioStore.fetchGoals).not.toHaveBeenCalled()
    expect(portfolioStore.goals).toEqual([])
    expect(wrapper.vm.goals.length).toBe(countBefore + 1)
    expect(wrapper.vm.goals.at(-1).title).toBe('Aposentadoria')
    expect(mockToast.success).toHaveBeenCalledWith('Meta criada com sucesso!')
  })

  it('editar meta também não chama updateGoal da store', async () => {
    const existing = wrapper.vm.goals[0]
    wrapper.vm.selectedGoal = existing
    wrapper.vm.showEditModal = true
    wrapper.vm.goalForm = {
      ...existing,
      title: 'Casa Própria Atualizada',
      targetValue: 180000
    }

    await wrapper.vm.saveGoal()
    await flushPromises()

    expect(portfolioStore.updateGoal).not.toHaveBeenCalled()
    expect(portfolioStore.createGoal).not.toHaveBeenCalled()
    expect(wrapper.vm.goals[0].title).toBe('Casa Própria Atualizada')
  })
})
