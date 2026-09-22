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

describe('Metas — progresso com alvo nulo ou string "0"', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  async function mountMetas() {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-22T10:00:00.000Z'))
    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })
    vi.advanceTimersByTime(1000)
    await flushPromises()
    await wrapper.vm.$nextTick()
  }

  it('targetValue numérico 0 devolve 0%', async () => {
    await mountMetas()

    expect(
      wrapper.vm.getProgressPercentage({
        currentValue: 5000,
        targetValue: 0
      })
    ).toBe(0)
  })

  it('targetValue null com currentValue vira 100% (Infinity capado)', async () => {
    await mountMetas()

    expect(
      wrapper.vm.getProgressPercentage({
        currentValue: 5000,
        targetValue: null
      })
    ).toBe(100)
  })

  it('targetValue string "0" também vira 100% — o === 0 não pega string', async () => {
    await mountMetas()

    expect(
      wrapper.vm.getProgressPercentage({
        currentValue: 5000,
        targetValue: '0'
      })
    ).toBe(100)
  })

  it('getCompletionDate com monthlyContribution "0" não trata como sem aporte', async () => {
    await mountMetas()
    wrapper.vm.goalForm.targetValue = 10000
    wrapper.vm.goalForm.currentValue = 2000
    wrapper.vm.goalForm.monthlyContribution = '0'

    expect(wrapper.vm.getCompletionDate()).not.toBe('Sem aportes')
  })
})
