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

describe('Metas — validateGoal com título nulo e saveGoal', () => {
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

  it('title null (edit de meta sem título) lança em trim em vez de erro de validação', async () => {
    await mountMetas()
    wrapper.vm.goalForm.title = null
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.targetDate = '2027-01-01'

    expect(() => wrapper.vm.validateGoal()).toThrow(TypeError)
  })

  it('title vazio recusa sem lançar', async () => {
    await mountMetas()
    wrapper.vm.goalForm.title = ''
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.targetDate = '2027-01-01'

    expect(wrapper.vm.validateGoal()).toBe(false)
    expect(wrapper.vm.goalErrors.title).toBe('Título é obrigatório')
  })

  it('saveGoal com title null rejeita fora do try/catch — meta não é criada e toast não dispara', async () => {
    await mountMetas()
    const before = wrapper.vm.goals.length
    wrapper.vm.goalForm.title = null
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.targetDate = '2027-01-01'

    await expect(wrapper.vm.saveGoal()).rejects.toThrow(TypeError)
    expect(wrapper.vm.goals).toHaveLength(before)
    expect(mockToast.error).not.toHaveBeenCalled()
  })
})
