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

describe('Metas — id Date.now() colide ao duplicar', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-18T10:00:00.000Z'))
    setActivePinia(createPinia())
    mockToast.success.mockClear()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/metas', name: 'Metas', component: Metas },
        { path: '/metas/:id', name: 'MetaDetalhe', component: { template: '<div />' } }
      ]
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

  it('duas duplicações no mesmo milissegundo geram o mesmo id', () => {
    const source = wrapper.vm.goals[0]
    const idsBefore = wrapper.vm.goals.map((goal) => goal.id)

    wrapper.vm.duplicateGoal(source)
    wrapper.vm.duplicateGoal(source)

    const copies = wrapper.vm.goals.filter((goal) => !idsBefore.includes(goal.id))
    expect(copies).toHaveLength(2)
    expect(copies[0].id).toBe(copies[1].id)
    expect(copies[0].id).toBe(Date.now())
  })

  it('excluir pelo id da cópia remove as duas quando os ids colidem', () => {
    const source = wrapper.vm.goals[0]
    wrapper.vm.duplicateGoal(source)
    wrapper.vm.duplicateGoal(source)

    const collidingId = Date.now()
    const countBefore = wrapper.vm.goals.length
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    wrapper.vm.deleteGoal({ id: collidingId, title: 'Cópia' })

    expect(wrapper.vm.goals).toHaveLength(countBefore - 1)
    expect(wrapper.vm.goals.filter((goal) => goal.id === collidingId)).toHaveLength(1)
  })
})
