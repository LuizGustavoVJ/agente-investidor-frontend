import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

import Metas from '@/views/Metas.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/metas/:id', component: { template: '<div />' } }
  ]
})

describe('Metas: simulador intra-mês, página órfã e mutações só locais', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-22T15:00:00.000Z'))
    toast.success.mockClear()
    toast.error.mockClear()
    toast.info.mockClear()

    wrapper = mount(Metas, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })
    await router.isReady()
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('getMonthsToTarget truncado a 0 para data futura no mesmo mês seguinte (< 1 mês cheio) vira aporte único do restante', () => {
    wrapper.vm.goalForm.targetDate = '2026-12-10'
    wrapper.vm.goalForm.targetValue = 12000
    wrapper.vm.goalForm.currentValue = 2000

    expect(wrapper.vm.getMonthsToTarget()).toBe(0)
    expect(wrapper.vm.getSimulatedContribution()).toBe(10000)
  })

  it('filtro/busca não reseta currentPage — página 2 fica vazia com 1 resultado', () => {
    for (let i = 10; i < 30; i++) {
      wrapper.vm.goals.push({
        id: i,
        title: `Meta extra ${i}`,
        description: 'x',
        category: 'other',
        targetValue: 1000,
        currentValue: 0,
        targetDate: '2099-12-31',
        status: 'active'
      })
    }

    expect(wrapper.vm.totalPages).toBeGreaterThan(1)
    wrapper.vm.currentPage = 2
    expect(wrapper.vm.paginatedGoals.length).toBeGreaterThan(0)

    wrapper.vm.searchTerm = 'Casa Própria'

    expect(wrapper.vm.filteredGoals).toHaveLength(1)
    expect(wrapper.vm.currentPage).toBe(2)
    expect(wrapper.vm.paginatedGoals).toHaveLength(0)
  })

  it('pause/resume/delete mutam só o array local e Metas.vue não importa portfolioAPI nem a store', async () => {
    const source = readFileSync(resolve(__dirname, '../../../src/views/Metas.vue'), 'utf8')
    expect(source).not.toMatch(/portfolioAPI/)
    expect(source).not.toMatch(/usePortfolioStore/)
    expect(source).not.toMatch(/@\/api\/portfolio/)
    expect(source).not.toMatch(/@\/stores\/portfolio/)

    const goal = wrapper.vm.goals.find(g => g.id === 1)
    await wrapper.vm.pauseGoal(goal)
    expect(wrapper.vm.goals.find(g => g.id === 1).status).toBe('paused')
    expect(toast.success).toHaveBeenCalledWith('Meta pausada')

    await wrapper.vm.resumeGoal(goal)
    expect(wrapper.vm.goals.find(g => g.id === 1).status).toBe('active')

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const before = wrapper.vm.goals.length
    await wrapper.vm.deleteGoal(goal)
    expect(wrapper.vm.goals.some(g => g.id === 1)).toBe(false)
    expect(wrapper.vm.goals.length).toBe(before - 1)
  })
})
