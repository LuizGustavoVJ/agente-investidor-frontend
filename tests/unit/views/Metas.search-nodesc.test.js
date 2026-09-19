import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

import Metas from '@/views/Metas.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }]
})

describe('Metas — busca com descrição ausente', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-19T10:00:00.000Z'))

    wrapper = mount(Metas, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })

    await vi.advanceTimersByTimeAsync(1000)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('meta sem description lança ao buscar termo que não está no título', () => {
    wrapper.vm.goals.push({
      id: 99,
      title: 'Reserva extra',
      status: 'active',
      targetValue: 5000,
      currentValue: 0,
      category: 'emergency',
      targetDate: '2027-01-01'
    })
    wrapper.vm.searchTerm = 'emergencia'

    expect(() => wrapper.vm.filteredGoals).toThrow(TypeError)
  })

  it('meta sem title lança em qualquer busca', () => {
    wrapper.vm.goals.push({
      id: 100,
      status: 'active',
      description: 'sem título',
      targetValue: 1000,
      currentValue: 0,
      category: 'other',
      targetDate: '2027-01-01'
    })
    wrapper.vm.searchTerm = 'sem'

    expect(() => wrapper.vm.filteredGoals).toThrow(TypeError)
  })
})
