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

describe('Metas — exportGoals afirma sucesso sem gerar arquivo', () => {
  let wrapper
  let createObjectURL
  let revokeObjectURL
  let createElementSpy

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-13T10:00:00.000Z'))

    createObjectURL = vi.fn(() => 'blob:mock')
    revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL
    })
    createElementSpy = vi.spyOn(document, 'createElement')

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } }]
    })
    await router.push('/dashboard')
    await router.isReady()

    wrapper = mount(Metas, {
      global: { plugins: [router] }
    })
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
    createElementSpy?.mockRestore()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('exportGoals toasta sucesso e não cria blob, download nem âncora', async () => {
    expect(wrapper.vm.goals.length).toBeGreaterThan(0)

    await wrapper.vm.exportGoals()
    await flushPromises()

    expect(mockToast.info).toHaveBeenCalledWith('Exportando metas...')
    expect(mockToast.success).toHaveBeenCalledWith('Metas exportadas com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalled()
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    const createdAnchors = createElementSpy.mock.results
      .map((result) => result.value)
      .filter((node) => node && node.tagName === 'A')
    expect(createdAnchors).toHaveLength(0)
    expect(wrapper.vm.goals).toHaveLength(3)
  })
})
