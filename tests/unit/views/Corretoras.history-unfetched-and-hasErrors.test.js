import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
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

describe('Corretoras: histórico nunca hidrata e hasErrors não alimenta o KPI', () => {
  let wrapper
  let store

  beforeEach(async () => {
    toast.success.mockClear()
    toast.error.mockClear()
    toast.info.mockClear()

    brokersAPI.getAvailableBrokers.mockResolvedValue(ok([]))
    brokersAPI.getConnectedBrokers.mockResolvedValue(ok([]))
    brokersAPI.getSyncStatus.mockResolvedValue(ok({}))
    brokersAPI.getPendingConflicts.mockResolvedValue(ok([]))
    brokersAPI.getSyncHistory.mockResolvedValue(ok([{ id: 1, brokerId: 'xp', status: 'success' }]))

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

  it('loadBrokersData/loadAllData não chamam fetchSyncHistory — UI de histórico fica vazia mesmo com API pronta', async () => {
    const viewSource = readFileSync(resolve(__dirname, '../../../src/views/Corretoras.vue'), 'utf8')
    const storeSource = readFileSync(resolve(__dirname, '../../../src/stores/brokers.js'), 'utf8')

    expect(viewSource).toMatch(/loadAllData/)
    expect(viewSource).not.toMatch(/fetchSyncHistory/)
    expect(storeSource).toMatch(/fetchAvailableBrokers/)
    expect(storeSource).toMatch(/fetchPendingConflicts/)
    expect(storeSource).not.toMatch(/fetchSyncHistory\(\)/)

    expect(brokersAPI.getSyncHistory).not.toHaveBeenCalled()
    expect(store.syncHistory).toEqual([])
    expect(wrapper.vm.paginatedSyncHistory).toEqual([])
    expect(wrapper.vm.filteredSyncHistory).toEqual([])
  })

  it('broker com hasErrors:true e status connected não muda o KPI — view filtra status==="error"', async () => {
    store.connectedBrokers = [
      { id: 'xp-1', name: 'XP', status: 'connected', hasErrors: true, accountInfo: '123' }
    ]
    await flushPromises()

    expect(store.brokersWithErrors).toHaveLength(1)
    expect(wrapper.vm.getOverallStatusText()).toBe('Conectado')
    expect(wrapper.vm.getOverallStatusClass()).toBe('connected')
    expect(wrapper.vm.getOverallStatusIcon()).toBe('✅')
    expect(wrapper.vm.getBrokerStatusClass('active')).toBe('unknown')
  })
})
