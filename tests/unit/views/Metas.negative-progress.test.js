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

describe('Metas — progresso negativo e classe visual', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  async function mountMetas() {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-24T10:00:00.000Z'))
    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })
    vi.advanceTimersByTime(1000)
    await flushPromises()
    await wrapper.vm.$nextTick()
  }

  it('currentValue negativo gera progresso negativo (sem piso em 0)', async () => {
    await mountMetas()

    const percentage = wrapper.vm.getProgressPercentage({
      currentValue: -1000,
      targetValue: 10000
    })

    expect(percentage).toBe(-10)
    expect(wrapper.vm.getProgressClass({
      currentValue: -1000,
      targetValue: 10000
    })).toBe('poor')
  })

  it('targetValue negativo não é tratado como inválido no progresso', async () => {
    await mountMetas()

    const percentage = wrapper.vm.getProgressPercentage({
      currentValue: 5000,
      targetValue: -10000
    })

    expect(percentage).toBe(-50)
  })
})
