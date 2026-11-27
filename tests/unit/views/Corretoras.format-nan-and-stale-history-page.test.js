import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingConflicts: vi.fn(),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    testConnection: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncHistory: vi.fn(),
    resolveDataConflict: vi.fn(),
    updateCredentials: vi.fn()
  }
}))

import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'
import { brokersAPI } from '@/api/brokers'

const ok = (data) => ({ data: { success: true, data } })

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/corretoras/:id', component: { template: '<div />' } },
    { path: '/corretoras/:id/configuracao', component: { template: '<div />' } }
  ]
})

describe('Corretoras: NaN/data inválida e página de histórico stale', () => {
  let wrapper
  let store

  beforeEach(async () => {
    toast.success.mockClear()
    toast.error.mockClear()

    brokersAPI.getAvailableBrokers.mockResolvedValue(ok([{ id: 'xp', name: 'XP' }]))
    brokersAPI.getConnectedBrokers.mockResolvedValue(
      ok([{ id: 'xp', connectionId: 'xp-1', name: 'XP', status: 'connected' }])
    )
    brokersAPI.getSyncStatus.mockResolvedValue(ok({}))
    brokersAPI.getPendingConflicts.mockResolvedValue(ok([]))

    const pinia = createPinia()
    setActivePinia(pinia)
    store = useBrokersStore()

    wrapper = mount(Corretoras, {
      global: {
        plugins: [pinia, router],
        stubs: { 'router-link': true }
      }
    })
    await router.isReady()
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('formatCurrency(NaN) não usa o fallback de nulo', () => {
    expect(wrapper.vm.formatCurrency(null)).toBe('R$ 0,00')
    expect(wrapper.vm.formatCurrency(undefined)).toBe('R$ 0,00')
    expect(wrapper.vm.formatCurrency(NaN)).not.toBe('R$ 0,00')
    expect(wrapper.vm.formatCurrency(NaN)).toMatch(/NaN/i)
  })

  it('formatDate e getTimeAgo lançam com data inválida', () => {
    expect(wrapper.vm.formatDate(null)).toBe('Nunca')
    expect(wrapper.vm.getTimeAgo(null)).toBe('')
    expect(() => wrapper.vm.formatDate('not-a-date')).toThrow()
    expect(() => wrapper.vm.getTimeAgo('not-a-date')).toThrow()
  })

  it('histórico global menor que a página atual deixa a lista vazia sem resetar currentHistoryPage', () => {
    store.syncHistory = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      brokerId: 'xp-1',
      status: 'success'
    }))
    wrapper.vm.currentHistoryPage = 2
    expect(wrapper.vm.paginatedSyncHistory).toHaveLength(10)

    store.syncHistory = [
      { id: 'a', brokerId: 'clear-1', status: 'success' },
      { id: 'b', brokerId: 'clear-1', status: 'error' }
    ]

    expect(wrapper.vm.currentHistoryPage).toBe(2)
    expect(wrapper.vm.totalHistoryPages).toBe(1)
    expect(wrapper.vm.paginatedSyncHistory).toEqual([])
  })
})
