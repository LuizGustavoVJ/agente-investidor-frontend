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

describe('Metas — canceladas no total e concluídas de outro ano', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-26T10:00:00.000Z'))

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
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('meta cancelled entra em totalTargetValue (só completed é excluída)', () => {
    wrapper.vm.goals = [
      {
        id: 1,
        title: 'Ativa',
        status: 'active',
        targetValue: 10000,
        currentValue: 1000,
        targetDate: '2026-12-31'
      },
      {
        id: 2,
        title: 'Cancelada',
        status: 'cancelled',
        targetValue: 100000,
        currentValue: 0,
        targetDate: '2026-12-31'
      }
    ]

    expect(wrapper.vm.totalTargetValue).toBe(110000)
  })

  it('completedGoals conta meta concluída em 2023 apesar do rótulo "este ano"', () => {
    wrapper.vm.goals = [
      {
        id: 3,
        title: 'Viagem 2023',
        status: 'completed',
        targetValue: 25000,
        currentValue: 25000,
        targetDate: '2023-06-01'
      },
      {
        id: 4,
        title: 'Ativa',
        status: 'active',
        targetValue: 10000,
        currentValue: 1000,
        targetDate: '2026-12-31'
      }
    ]

    expect(wrapper.vm.completedGoals).toBe(1)
    expect(wrapper.text()).toContain('este ano')
  })
})
