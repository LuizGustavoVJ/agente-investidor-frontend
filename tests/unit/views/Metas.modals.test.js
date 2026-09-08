import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
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
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/metas', component: Metas },
    { path: '/metas/:id', name: 'MetaDetalhe', component: { template: '<div />' } }
  ]
})

describe('Metas — closeModals e closeContributionModal', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    mockToast.success.mockClear()
    mockToast.info.mockClear()
    mockToast.error.mockClear()

    wrapper = mount(Metas, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })

    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('closeModals zera formulário, erros e seleção', async () => {
    wrapper.vm.showCreateModal = true
    wrapper.vm.showEditModal = true
    wrapper.vm.selectedGoal = { id: 1, title: 'Casa' }
    wrapper.vm.goalForm = {
      title: 'Casa',
      description: 'Entrada',
      category: 'house',
      targetValue: 150000,
      currentValue: 1000,
      targetDate: '2027-01-01',
      monthlyContribution: 500
    }
    wrapper.vm.goalErrors = { title: 'Título é obrigatório' }

    wrapper.vm.closeModals()
    await flushPromises()

    expect(wrapper.vm.showCreateModal).toBe(false)
    expect(wrapper.vm.showEditModal).toBe(false)
    expect(wrapper.vm.selectedGoal).toBeNull()
    expect(wrapper.vm.goalForm).toEqual({
      title: '',
      description: '',
      category: '',
      targetValue: 0,
      currentValue: 0,
      targetDate: '',
      monthlyContribution: 0
    })
    expect(wrapper.vm.goalErrors).toEqual({})
  })

  it('closeContributionModal zera aporte sem alterar as metas', () => {
    const goalsSnapshot = wrapper.vm.goals.map((goal) => ({ ...goal }))
    wrapper.vm.showContributionModal = true
    wrapper.vm.selectedGoal = wrapper.vm.goals[0]
    wrapper.vm.contributionForm = { amount: 250, date: '2026-01-01', note: 'extra' }
    wrapper.vm.contributionErrors = { amount: 'Valor deve ser maior que zero' }

    wrapper.vm.closeContributionModal()

    expect(wrapper.vm.showContributionModal).toBe(false)
    expect(wrapper.vm.selectedGoal).toBeNull()
    expect(wrapper.vm.contributionForm).toEqual({ amount: 0, date: '', note: '' })
    expect(wrapper.vm.contributionErrors).toEqual({})
    expect(wrapper.vm.goals).toEqual(goalsSnapshot)
  })
})
