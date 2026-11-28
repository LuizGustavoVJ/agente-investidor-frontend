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

describe('Corretoras: syncAll falso toasta sucesso e envelope de histórico derruba o filtro', () => {
  let wrapper
  let store

  beforeEach(async () => {
    toast.success.mockClear()
    toast.error.mockClear()
    toast.info.mockClear()

    brokersAPI.getAvailableBrokers.mockResolvedValue(ok([{ id: 'xp', name: 'XP' }]))
    brokersAPI.getConnectedBrokers.mockResolvedValue(
      ok([{ id: 'xp', connectionId: 'xp-1', name: 'XP', status: 'connected', totalValue: 1000 }])
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

  it('syncAllBrokers com {success:false} toasta sucesso, grava error e esconde os cards (hasError)', async () => {
    brokersAPI.syncAllBrokers.mockResolvedValue({
      data: { success: false, message: 'timeout na XP' }
    })

    await wrapper.vm.syncAllBrokers()
    await flushPromises()

    expect(toast.success).toHaveBeenCalledWith('Sincronização concluída!')
    expect(toast.error).not.toHaveBeenCalled()
    expect(store.error).toBe('timeout na XP')
    expect(wrapper.vm.hasError).toBe(true)
  })

  it('syncHistory null é protegido por || []; envelope objeto passa no filtro all e quebra a paginação', () => {
    store.syncHistory = null
    expect(wrapper.vm.syncHistory).toEqual([])
    expect(wrapper.vm.filteredSyncHistory).toEqual([])

    store.syncHistory = { items: [{ id: 1, brokerId: 'xp-1', status: 'success' }] }

    expect(wrapper.vm.filteredSyncHistory).toEqual({
      items: [{ id: 1, brokerId: 'xp-1', status: 'success' }]
    })
    expect(() => wrapper.vm.paginatedSyncHistory).toThrow()

    wrapper.vm.selectedHistoryFilter = 'xp-1'
    expect(() => wrapper.vm.filteredSyncHistory).toThrow()

    wrapper.vm.selectedHistoryFilter = 'all'
    store.syncHistory = []
  })

  it('connectedBrokers como objeto (não array) faz a busca lançar — || [] só cobre null', () => {
    store.connectedBrokers = { brokers: [{ id: 'xp', name: 'XP' }] }
    wrapper.vm.searchTerm = 'xp'

    expect(() => wrapper.vm.filteredConnectedBrokers).toThrow()

    wrapper.vm.searchTerm = ''
    store.connectedBrokers = [
      { id: 'xp', connectionId: 'xp-1', name: 'XP', status: 'connected' }
    ]
  })
})
