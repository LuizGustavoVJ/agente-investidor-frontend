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

describe('Metas — atraso e progresso com status/alvo inválidos', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-07T10:00:00.000Z'))

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

  it('meta pausada com data passada continua atrasada', () => {
    const paused = {
      id: 90,
      title: 'Carro',
      description: 'Pausada',
      status: 'paused',
      targetDate: '2020-01-01',
      targetValue: 40000,
      currentValue: 5000
    }

    expect(wrapper.vm.isOverdue(paused)).toBe(true)
    expect(wrapper.vm.getTimeRemaining(paused)).toBe('Atrasada')
  })

  it('meta cancelada com data passada também entra no filtro Atrasadas', async () => {
    wrapper.vm.goals = [
      {
        id: 91,
        title: 'Cancelada antiga',
        description: 'Não deveria cobrar',
        status: 'cancelled',
        category: 'other',
        targetDate: '2019-06-01',
        targetValue: 10000,
        currentValue: 0
      }
    ]
    wrapper.vm.selectedStatusFilter = 'overdue'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isOverdue(wrapper.vm.goals[0])).toBe(true)
    expect(wrapper.vm.filteredGoals).toHaveLength(1)
    expect(wrapper.vm.filteredGoals[0].id).toBe(91)
  })

  it('targetValue null devolve 100% de progresso, não 0', () => {
    expect(wrapper.vm.getProgressPercentage({
      currentValue: 8000,
      targetValue: null
    })).toBe(100)
  })
})
