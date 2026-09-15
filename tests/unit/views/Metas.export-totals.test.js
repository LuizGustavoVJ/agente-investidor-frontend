import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
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

describe('Metas — exportação, totais e data de conclusão', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'))
    setActivePinia(createPinia())
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.info.mockReset()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/metas', component: { template: '<div />' } }]
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

  it('exportGoals mostra sucesso sem gerar Blob nem link de download', async () => {
    const createObjectURL = vi.fn()
    global.URL.createObjectURL = createObjectURL
    const createElement = vi.spyOn(document, 'createElement')
    createElement.mockClear()

    await wrapper.vm.exportGoals()

    expect(mockToast.success).toHaveBeenCalledWith('Metas exportadas com sucesso!')
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(createElement.mock.calls.filter(([tag]) => tag === 'a')).toHaveLength(0)
  })

  it('totalTargetValue concatena se targetValue vier como string da API', () => {
    wrapper.vm.goals[0].targetValue = '150000'
    wrapper.vm.goals[1].targetValue = 30000

    expect(wrapper.vm.totalTargetValue).toBe('015000030000')
    expect(wrapper.vm.totalTargetValue).not.toBe(180000)
  })

  it('getCompletionDate devolve data passada se o atual já passou do alvo', () => {
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.currentValue = 15000
    wrapper.vm.goalForm.monthlyContribution = 1000

    expect(wrapper.vm.getCompletionDate()).toBe('04/2026')
  })

  it('validateGoal lança se title estiver ausente (edição de payload incompleto)', () => {
    wrapper.vm.goalForm = {
      title: undefined,
      targetValue: 10000,
      targetDate: '2027-01-01'
    }

    expect(() => wrapper.vm.validateGoal()).toThrow()
  })
})
