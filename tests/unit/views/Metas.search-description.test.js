import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
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

describe('Metas — busca com descrição ausente', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/metas', component: { template: '<div />' } }]
    })

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

  it('lança TypeError ao buscar se a meta vier da API sem description', () => {
    wrapper.vm.goals.push({
      id: 99,
      title: 'Aposentadoria',
      category: 'retirement',
      targetValue: 500000,
      currentValue: 10000,
      targetDate: '2035-01-01',
      monthlyContribution: 1000,
      status: 'active'
    })

    expect(() => {
      // termo que não casa o title — o || avalia description e explode
      wrapper.vm.searchTerm = 'campo-ausente-api'
      return wrapper.vm.filteredGoals
    }).toThrow(TypeError)
  })

  it('lança TypeError ao buscar se title estiver ausente', () => {
    wrapper.vm.goals.push({
      id: 100,
      description: 'Sem título vindo da API',
      category: 'other',
      targetValue: 1000,
      currentValue: 0,
      targetDate: '2030-01-01',
      status: 'active'
    })

    expect(() => {
      wrapper.vm.searchTerm = 'titulo'
      return wrapper.vm.filteredGoals
    }).toThrow(TypeError)
  })

  it('devolve aporte sugerido negativo quando o valor atual passa do alvo', () => {
    const overfunded = {
      targetValue: 1000,
      currentValue: 1500,
      targetDate: '2030-12-31'
    }

    expect(wrapper.vm.getSuggestedContribution(overfunded)).toBeLessThan(0)
  })
})
