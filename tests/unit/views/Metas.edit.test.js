import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { addMonths, format } from 'date-fns'
import Metas from '@/views/Metas.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/metas', name: 'Metas', component: Metas },
    { path: '/metas/:id', name: 'MetaDetalhe', component: { template: '<div>detalhe</div>' } }
  ]
})

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Metas — edição, detalhe, ícones e resumo', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    mockToast.success.mockClear()

    wrapper = mount(Metas, {
      global: {
        plugins: [router]
      }
    })

    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('atualiza a meta existente sem criar outra', async () => {
    const goal = wrapper.vm.goals.find((item) => item.id === 1)
    wrapper.vm.editGoal(goal)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showEditModal).toBe(true)
    wrapper.vm.goalForm.title = 'Casa reformada'
    wrapper.vm.goalForm.targetValue = 180000

    await wrapper.vm.saveGoal()

    expect(wrapper.vm.goals).toHaveLength(3)
    expect(wrapper.vm.goals.find((item) => item.id === 1).title).toBe('Casa reformada')
    expect(wrapper.vm.goals.find((item) => item.id === 1).targetValue).toBe(180000)
    expect(mockToast.success).toHaveBeenCalledWith('Meta atualizada com sucesso!')
    expect(wrapper.vm.showEditModal).toBe(false)
  })

  it('navega para o detalhe da meta pelo id', async () => {
    const push = vi.spyOn(router, 'push')
    wrapper.vm.viewGoalDetails({ id: 2 })
    expect(push).toHaveBeenCalledWith('/metas/2')
  })

  it('média de progresso é 0 sem metas ativas e ícone desconhecido cai no fallback', () => {
    wrapper.vm.goals = [{ id: 9, status: 'completed', targetValue: 10, currentValue: 10 }]
    expect(wrapper.vm.averageProgress).toBe(0)
    expect(wrapper.vm.totalTargetValue).toBe(0)
    expect(wrapper.vm.getCategoryIcon('unknown-cat')).toBe('🎯')
    expect(wrapper.vm.getCategoryIcon('house')).toBe('🏠')
  })

  it('getMonthsToTarget usa a data do formulário e 0 quando vazia', () => {
    wrapper.vm.goalForm.targetDate = ''
    expect(wrapper.vm.getMonthsToTarget()).toBe(0)

    wrapper.vm.goalForm.targetDate = format(addMonths(new Date(), 6), 'yyyy-MM-dd')
    expect(wrapper.vm.getMonthsToTarget()).toBeGreaterThanOrEqual(5)
    expect(wrapper.vm.getMonthsToTarget()).toBeLessThanOrEqual(6)
  })

  it('toggleDropdown abre, fecha e troca o item ativo', () => {
    wrapper.vm.toggleDropdown(1)
    expect(wrapper.vm.activeDropdown).toBe(1)
    wrapper.vm.toggleDropdown(1)
    expect(wrapper.vm.activeDropdown).toBeNull()
    wrapper.vm.toggleDropdown(2)
    wrapper.vm.toggleDropdown(3)
    expect(wrapper.vm.activeDropdown).toBe(3)
  })
})
