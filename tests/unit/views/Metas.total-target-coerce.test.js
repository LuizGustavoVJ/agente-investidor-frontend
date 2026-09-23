import { describe, it, expect, afterEach, vi } from 'vitest'
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

describe('Metas — totalTargetValue e progresso com tipos errados', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  async function mountMetas() {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-23T10:00:00.000Z'))
    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })
    vi.advanceTimersByTime(1000)
    await flushPromises()
    await wrapper.vm.$nextTick()
  }

  it('targetValue string concatena no total em vez de somar', async () => {
    await mountMetas()

    wrapper.vm.goals = [
      {
        id: 1,
        status: 'active',
        title: 'A',
        description: '',
        category: 'other',
        targetValue: '150000',
        currentValue: 1000,
        targetDate: '2027-12-31',
        startDate: '2026-01-01',
        monthlyContribution: 100
      },
      {
        id: 2,
        status: 'active',
        title: 'B',
        description: '',
        category: 'other',
        targetValue: 30000,
        currentValue: 1000,
        targetDate: '2027-12-31',
        startDate: '2026-01-01',
        monthlyContribution: 100
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.totalTargetValue).toBe('015000030000')
    expect(typeof wrapper.vm.totalTargetValue).toBe('string')
  })

  it('currentValue undefined vira NaN% no progresso', async () => {
    await mountMetas()

    expect(
      wrapper.vm.getProgressPercentage({
        currentValue: undefined,
        targetValue: 10000
      })
    ).toBeNaN()
  })

  it('meta completed não entra no total mesmo com targetValue string', async () => {
    await mountMetas()

    wrapper.vm.goals = [
      {
        id: 1,
        status: 'completed',
        title: 'Feita',
        description: '',
        category: 'other',
        targetValue: '999999',
        currentValue: 1,
        targetDate: '2025-01-01',
        startDate: '2024-01-01',
        monthlyContribution: 0
      },
      {
        id: 2,
        status: 'active',
        title: 'Ativa',
        description: '',
        category: 'other',
        targetValue: 10000,
        currentValue: 0,
        targetDate: '2027-12-31',
        startDate: '2026-01-01',
        monthlyContribution: 100
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.totalTargetValue).toBe(10000)
  })
})
