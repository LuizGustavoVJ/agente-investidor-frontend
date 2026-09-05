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

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/metas', name: 'Metas', component: { template: '<div />' } }]
})

describe('Metas — labels, atraso e filtros', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-05T12:00:00.000Z'))

    wrapper = mount(Metas, {
      global: {
        plugins: [router]
      }
    })
    vi.advanceTimersByTime(1000)
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('mapeia categoria e status com fallback seguro', () => {
    expect(wrapper.vm.getCategoryIcon('house')).toBe('🏠')
    expect(wrapper.vm.getCategoryIcon('unknown')).toBe('🎯')
    expect(wrapper.vm.getCategoryName('emergency')).toBe('Reserva de Emergência')
    expect(wrapper.vm.getCategoryName('xyz')).toBe('Outros')
    expect(wrapper.vm.getStatusText('paused')).toBe('Pausada')
    expect(wrapper.vm.getStatusText('cancelled')).toBe('Cancelada')
    expect(wrapper.vm.getStatusText('nope')).toBe('Desconhecido')
  })

  it('classifica tempo restante de meta concluída, atrasada e futura', () => {
    expect(wrapper.vm.getTimeRemaining({
      status: 'completed',
      targetDate: '2024-01-01'
    })).toBe('Concluída')

    expect(wrapper.vm.getTimeRemaining({
      status: 'active',
      targetDate: '2024-12-31'
    })).toBe('Atrasada')

    const future = wrapper.vm.getTimeRemaining({
      status: 'active',
      targetDate: '2027-01-01'
    })
    expect(future).not.toBe('Concluída')
    expect(future).not.toBe('Atrasada')
    expect(future.length).toBeGreaterThan(0)
  })

  it('não marca meta concluída como atrasada mesmo com data no passado', () => {
    expect(wrapper.vm.isOverdue({
      status: 'completed',
      targetDate: '2020-01-01'
    })).toBe(false)
  })

  it('filtra metas atrasadas e por categoria', async () => {
    wrapper.vm.goals = [
      { id: 1, title: 'Atrasada', description: '', category: 'house', status: 'active', targetDate: '2024-01-01', targetValue: 10, currentValue: 1 },
      { id: 2, title: 'No prazo', description: '', category: 'travel', status: 'active', targetDate: '2027-01-01', targetValue: 10, currentValue: 1 },
      { id: 3, title: 'Feita', description: '', category: 'house', status: 'completed', targetDate: '2024-01-01', targetValue: 10, currentValue: 10 }
    ]
    wrapper.vm.selectedStatusFilter = 'overdue'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredGoals.map((goal) => goal.id)).toEqual([1])

    wrapper.vm.selectedStatusFilter = 'all'
    wrapper.vm.selectedCategoryFilter = 'house'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredGoals.map((goal) => goal.id)).toEqual([1, 3])
  })

  it('formata valor nulo como zero e data vazia como Não definido', () => {
    const formatted = wrapper.vm.formatCurrency(null)
    expect(formatted.replace(/\u00a0/g, ' ')).toMatch(/R\$\s*0,00/)
    expect(wrapper.vm.formatDate(null)).toBe('Não definido')
  })

  it('estima aporte simulado sem meses restantes como o valor que falta', async () => {
    wrapper.vm.goalForm = {
      title: 'X',
      targetValue: 1000,
      currentValue: 200,
      targetDate: '2026-09-01',
      monthlyContribution: 0
    }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.getSimulatedContribution()).toBe(800)
  })
})
