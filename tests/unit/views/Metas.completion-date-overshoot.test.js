import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { format, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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

describe('Metas — data simulada de conclusão com overshoot e aporte zero', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00.000Z'))
    setActivePinia(createPinia())
    mockToast.success.mockClear()

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

  it('getCompletionDate com currentValue acima do alvo devolve data no passado', () => {
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.currentValue = 16000
    wrapper.vm.goalForm.monthlyContribution = 1000

    const result = wrapper.vm.getCompletionDate()
    const expected = format(addMonths(new Date('2026-10-16T12:00:00.000Z'), -6), 'MM/yyyy', { locale: ptBR })

    expect(result).toBe(expected)
    expect(result).toBe('04/2026')
  })

  it('getSimulatedContribution com overshoot e prazo esgotado devolve restante negativo', () => {
    wrapper.vm.goalForm.targetValue = 30000
    wrapper.vm.goalForm.currentValue = 45000
    wrapper.vm.goalForm.targetDate = '2025-01-01'

    expect(wrapper.vm.getMonthsToTarget()).toBeLessThanOrEqual(0)
    expect(wrapper.vm.getSimulatedContribution()).toBe(-15000)
  })

  it('getCompletionDate sem aporte mensal não projeta data mesmo com overshoot', () => {
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.currentValue = 16000
    wrapper.vm.goalForm.monthlyContribution = 0

    expect(wrapper.vm.getCompletionDate()).toBe('Sem aportes')
  })
})
