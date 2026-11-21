import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

import Metas from '@/views/Metas.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/metas/:id', component: { template: '<div />' } }
  ]
})

describe('Metas: busca, aporte string e edição destrutiva', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
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

  it('filteredGoals quebra quando description é null e o termo não casa com o título', () => {
    wrapper.vm.goals.push({
      id: 99,
      title: 'Meta sem texto extra',
      description: null,
      category: 'other',
      targetValue: 1000,
      currentValue: 0,
      targetDate: '2099-12-31',
      status: 'active'
    })
    wrapper.vm.searchTerm = 'xyznaoexiste'

    expect(() => [...wrapper.vm.filteredGoals]).toThrow()
  })

  it('aporte com amount string concatena em vez de somar', async () => {
    const goal = wrapper.vm.goals.find(g => g.id === 1)
    const before = goal.currentValue
    wrapper.vm.selectedGoal = goal
    wrapper.vm.contributionForm.amount = '1000'
    wrapper.vm.contributionForm.date = '2026-01-01'

    await wrapper.vm.submitContribution()

    expect(wrapper.vm.goals.find(g => g.id === 1).currentValue).toBe(before + '1000')
    expect(typeof wrapper.vm.goals.find(g => g.id === 1).currentValue).toBe('string')
  })

  it('editGoal espalha o objeto inteiro e saveGoal pode sobrescrever id e status', async () => {
    const original = wrapper.vm.goals.find(g => g.id === 1)
    wrapper.vm.editGoal(original)
    wrapper.vm.goalForm.id = 999
    wrapper.vm.goalForm.status = 'cancelled'
    wrapper.vm.goalForm.title = 'Casa Editada'
    wrapper.vm.goalForm.targetValue = original.targetValue
    wrapper.vm.goalForm.targetDate = '2099-12-31'

    await wrapper.vm.saveGoal()

    const updated = wrapper.vm.goals.find(g => g.title === 'Casa Editada')
    expect(updated.id).toBe(999)
    expect(updated.status).toBe('cancelled')
    expect(wrapper.vm.goals.some(g => g.id === 1)).toBe(false)
  })

  it('totalTargetValue inclui metas pausadas, não só ativas', () => {
    wrapper.vm.goals.push({
      id: 50,
      title: 'Pausada',
      description: 'x',
      category: 'other',
      targetValue: 80000,
      currentValue: 1000,
      targetDate: '2099-12-31',
      status: 'paused'
    })

    const activeSum = wrapper.vm.goals
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + g.targetValue, 0)

    expect(wrapper.vm.totalTargetValue).toBeGreaterThan(activeSum)
    expect(wrapper.vm.totalTargetValue).toBe(activeSum + 80000)
  })

  it('getProgressPercentage aceita currentValue negativo e devolve percentual negativo', () => {
    const percent = wrapper.vm.getProgressPercentage({
      currentValue: -50,
      targetValue: 100
    })

    expect(percent).toBe(-50)
  })

  it('saveGoal não chama API/store — só muta o array local', async () => {
    wrapper.vm.showEditModal = false
    wrapper.vm.goalForm = {
      title: 'Nova local',
      description: 'só memória',
      category: 'other',
      targetValue: 5000,
      currentValue: 0,
      targetDate: '2099-01-01',
      monthlyContribution: 100
    }

    await wrapper.vm.saveGoal()

    expect(wrapper.vm.goals.some(g => g.title === 'Nova local')).toBe(true)
    expect(wrapper.vm.goals.find(g => g.title === 'Nova local').status).toBe('active')
  })
})
