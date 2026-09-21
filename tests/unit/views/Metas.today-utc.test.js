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

describe('Metas — today em UTC vs validação de data', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('validateGoal rejeita a própria data de today: ISO date-only é meia-noite UTC, já no passado', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T10:15:00.000Z'))

    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })
    vi.advanceTimersByTime(1000)
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.today).toBe('2026-09-21')

    wrapper.vm.goalForm.title = 'Reserva de emergência'
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.targetDate = wrapper.vm.today

    const valid = wrapper.vm.validateGoal()

    expect(valid).toBe(false)
    expect(wrapper.vm.goalErrors.targetDate).toBe('Data objetivo deve ser futura')
  })

  it('today usa toISOString: à noite em America/Sao_Paulo vira o dia UTC seguinte', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T22:30:00-03:00'))

    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })
    vi.advanceTimersByTime(1000)
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.today).toBe('2026-09-22')
  })
})
