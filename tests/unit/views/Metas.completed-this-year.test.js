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

describe('Metas — KPI "concluídas este ano" conta qualquer completed', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T10:00:00.000Z'))

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

  it('meta concluída em 2024 entra no card "este ano" em 2026', () => {
    const from2024 = wrapper.vm.goals.find((g) => g.status === 'completed')
    expect(from2024).toBeTruthy()
    expect(from2024.targetDate.startsWith('2024')).toBe(true)
    expect(wrapper.vm.completedGoals).toBe(1)
    expect(wrapper.text()).toContain('este ano')
  })

  it('concluídas de 2023 e 2026 somam juntas — não há filtro de ano', async () => {
    wrapper.vm.goals = [
      {
        id: 10,
        title: 'Antiga',
        description: '2023',
        status: 'completed',
        category: 'travel',
        targetDate: '2023-06-01',
        startDate: '2022-01-01',
        targetValue: 10000,
        currentValue: 10000
      },
      {
        id: 11,
        title: 'Deste ano',
        description: '2026',
        status: 'completed',
        category: 'emergency',
        targetDate: '2026-03-01',
        startDate: '2026-01-01',
        targetValue: 5000,
        currentValue: 5000
      },
      {
        id: 12,
        title: 'Ainda ativa',
        description: 'não conta',
        status: 'active',
        category: 'house',
        targetDate: '2027-01-01',
        startDate: '2026-01-01',
        targetValue: 80000,
        currentValue: 1000
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.completedGoals).toBe(2)
  })
})
