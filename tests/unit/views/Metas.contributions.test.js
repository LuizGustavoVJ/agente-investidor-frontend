import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Metas from '@/views/Metas.vue'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Metas — aportes, atraso e persistência local', () => {
  let wrapper
  let router

  beforeEach(async () => {
    vi.useFakeTimers({ now: new Date('2026-11-18T10:00:00.000Z') })
    setActivePinia(createPinia())
    toast.success.mockClear()
    toast.error.mockClear()
    toast.info.mockClear()

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/metas', component: { template: '<div />' } },
        { path: '/metas/:id', component: { template: '<div />' } }
      ]
    })
    await router.push('/metas')
    await router.isReady()

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

  it('getProgressPercentage cap 100 e target 0 devolve 0', () => {
    expect(wrapper.vm.getProgressPercentage({ currentValue: 50, targetValue: 0 })).toBe(0)
    expect(wrapper.vm.getProgressPercentage({ currentValue: 250, targetValue: 100 })).toBe(100)
    expect(wrapper.vm.getProgressPercentage(null)).toBe(0)
  })

  it('isOverdue ignora concluídas mesmo com data passada', () => {
    const past = '2020-01-01'
    expect(wrapper.vm.isOverdue({ status: 'completed', targetDate: past })).toBe(false)
    expect(wrapper.vm.isOverdue({ status: 'active', targetDate: past })).toBe(true)
    expect(wrapper.vm.isOverdue({ status: 'paused', targetDate: past })).toBe(true)
  })

  it('aporte em meta pausada ainda soma e pode marcar completed', async () => {
    wrapper.vm.goals.push({
      id: 999,
      title: 'Pausada',
      status: 'paused',
      currentValue: 80,
      targetValue: 100,
      monthlyContribution: 10
    })
    wrapper.vm.addContribution(wrapper.vm.goals.find(g => g.id === 999))
    wrapper.vm.contributionForm.amount = 30
    await wrapper.vm.submitContribution()

    const goal = wrapper.vm.goals.find(g => g.id === 999)
    expect(goal.currentValue).toBe(110)
    expect(goal.status).toBe('completed')
  })

  it('validateContribution aceita valor negativo? não — mas não checa meta pausada/cancelada', () => {
    wrapper.vm.contributionForm.amount = 0
    expect(wrapper.vm.validateContribution()).toBe(false)
    wrapper.vm.contributionForm.amount = 10
    expect(wrapper.vm.validateContribution()).toBe(true)
  })

  it('getSuggestedContribution com prazo vencido devolve o restante inteiro', () => {
    const goal = {
      targetValue: 1000,
      currentValue: 200,
      targetDate: '2020-01-01'
    }
    expect(wrapper.vm.getSuggestedContribution(goal)).toBe(800)
  })

  it('duplicateGoal zera currentValue mas copia monthlyContribution da origem', async () => {
    const original = wrapper.vm.goals[0]
    original.monthlyContribution = 250
    original.currentValue = 5000
    await wrapper.vm.duplicateGoal(original)

    const copy = wrapper.vm.goals.find(g => g.title === `${original.title} (Cópia)`)
    expect(copy.currentValue).toBe(0)
    expect(copy.monthlyContribution).toBe(250)
    expect(copy.status).toBe('active')
    expect(copy.id).not.toBe(original.id)
  })

  it('saveGoal não chama API — só muta o array local', async () => {
    wrapper.vm.goalForm.title = 'Nova'
    wrapper.vm.goalForm.targetValue = 1000
    wrapper.vm.goalForm.targetDate = '2099-12-31'
    wrapper.vm.goalForm.category = 'emergency'
    wrapper.vm.showEditModal = false

    const before = wrapper.vm.goals.length
    await wrapper.vm.saveGoal()

    expect(wrapper.vm.goals.length).toBe(before + 1)
    expect(toast.success).toHaveBeenCalledWith('Meta criada com sucesso!')
  })

  it('viewGoalDetails navega para /metas/:id, rota que o router da app não declara', async () => {
    const push = vi.spyOn(router, 'push')
    wrapper.vm.viewGoalDetails({ id: 42 })
    expect(push).toHaveBeenCalledWith('/metas/42')
  })
})
