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

describe('Metas — editar alvo abaixo do valor atual não conclui a meta', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-12T10:00:00.000Z'))

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }
      ]
    })
    await router.push('/dashboard')
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
    vi.clearAllMocks()
  })

  it('saveGoal com targetValue < currentValue mantém status active e progresso 100%', async () => {
    const goal = wrapper.vm.goals.find((item) => item.id === 1)
    expect(goal.status).toBe('active')
    expect(goal.currentValue).toBe(45000)
    expect(goal.targetValue).toBe(150000)

    wrapper.vm.editGoal(goal)
    wrapper.vm.goalForm.targetValue = 40000
    wrapper.vm.goalForm.targetDate = '2027-12-31'
    await wrapper.vm.$nextTick()

    await wrapper.vm.saveGoal()
    await flushPromises()

    const updated = wrapper.vm.goals.find((item) => item.id === 1)
    expect(updated.targetValue).toBe(40000)
    expect(updated.currentValue).toBe(45000)
    expect(updated.status).toBe('active')
    expect(wrapper.vm.getProgressPercentage(updated)).toBe(100)
    expect(mockToast.success).toHaveBeenCalledWith('Meta atualizada com sucesso!')
  })

  it('validateGoal aceita categoria vazia — HTML required não vale na action', () => {
    wrapper.vm.goalForm.title = 'Meta sem categoria'
    wrapper.vm.goalForm.category = ''
    wrapper.vm.goalForm.targetValue = 5000
    wrapper.vm.goalForm.targetDate = '2027-06-01'

    expect(wrapper.vm.validateGoal()).toBe(true)
    expect(wrapper.vm.goalErrors.category).toBeUndefined()
  })
})
