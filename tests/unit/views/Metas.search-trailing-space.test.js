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

describe('Metas — busca com espaço no fim não encontra a meta', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-25T10:00:00.000Z'))

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
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('termo "Casa Própria " (espaço no fim) não encontra a meta', () => {
    wrapper.vm.searchTerm = 'Casa Própria '

    expect(wrapper.vm.filteredGoals).toEqual([])
  })

  it('termo "Casa Própria" sem espaço encontra a meta', () => {
    wrapper.vm.searchTerm = 'Casa Própria'

    expect(wrapper.vm.filteredGoals.map((goal) => goal.title)).toEqual(['Casa Própria'])
  })
})
