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

describe('Metas: data ISO de hoje, aporte "0" e exportação fantasma', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-23T15:00:00.000Z'))
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

  it('isOverdue é true para targetDate igual ao dia UTC corrente — meta vence "hoje" já nasce atrasada', () => {
    const goal = {
      id: 99,
      status: 'active',
      targetDate: '2026-11-23'
    }

    expect(wrapper.vm.today).toBe('2026-11-23')
    expect(wrapper.vm.isOverdue(goal)).toBe(true)
    expect(wrapper.vm.getTimeRemaining(goal)).toBe('Atrasada')
  })

  it('o date picker min=today permite hoje, mas validateGoal rejeita a mesma data como não futura', () => {
    wrapper.vm.goalForm.title = 'Reserva'
    wrapper.vm.goalForm.targetValue = 5000
    wrapper.vm.goalForm.targetDate = wrapper.vm.today

    const valid = wrapper.vm.validateGoal()

    expect(valid).toBe(false)
    expect(wrapper.vm.goalErrors.targetDate).toBe('Data objetivo deve ser futura')
  })

  it('getCompletionDate com monthlyContribution "0" (v-model sem .number) lança em vez de "Sem aportes"', () => {
    const source = readFileSync(resolve(__dirname, '../../../src/views/Metas.vue'), 'utf8')
    expect(source).toMatch(/v-model="goalForm\.monthlyContribution"/)
    expect(source).not.toMatch(/v-model\.number="goalForm\.monthlyContribution"/)

    wrapper.vm.goalForm.targetValue = 12000
    wrapper.vm.goalForm.currentValue = 2000
    wrapper.vm.goalForm.monthlyContribution = '0'

    expect(() => wrapper.vm.getCompletionDate()).toThrow(/Invalid time value/)
  })

  it('exportGoals só toasta sucesso — fonte não gera blob, download nem chama API', async () => {
    const source = readFileSync(resolve(__dirname, '../../../src/views/Metas.vue'), 'utf8')
    expect(source).not.toMatch(/createObjectURL/)
    expect(source).not.toMatch(/createElement\(['"]a['"]\)/)
    expect(source).not.toMatch(/portfolioAPI/)
    expect(source).toMatch(/toast\.success\('Metas exportadas com sucesso!'\)/)

    await wrapper.vm.exportGoals()

    expect(toast.info).toHaveBeenCalledWith('Exportando metas...')
    expect(toast.success).toHaveBeenCalledWith('Metas exportadas com sucesso!')
  })

  it('hasError nunca é ligado — loadGoalsData é timeout e o painel de erro/retry é morto', () => {
    const source = readFileSync(resolve(__dirname, '../../../src/views/Metas.vue'), 'utf8')
    expect(source).toMatch(/const hasError = ref\(false\)/)
    expect(source).not.toMatch(/hasError\.value\s*=\s*true/)

    expect(wrapper.vm.hasError).toBe(false)
    expect(wrapper.find('.error-container').exists()).toBe(false)
    expect(wrapper.find('.metas-content').exists()).toBe(true)
  })
})
