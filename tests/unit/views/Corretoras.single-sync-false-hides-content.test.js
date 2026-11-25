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

describe('Corretoras: sync de uma corretora com success:false esconde a tela', () => {
  let wrapper
  let store
  const connected = [
    {
      id: 'xp',
      connectionId: 'xp-1',
      name: 'XP',
      status: 'connected',
      accountInfo: '123'
    }
  ]

  beforeEach(async () => {
    toast.success.mockClear()
    toast.error.mockClear()
    toast.info.mockClear()

    brokersAPI.getAvailableBrokers.mockResolvedValue(ok([{ id: 'xp', name: 'XP' }]))
    brokersAPI.getConnectedBrokers.mockResolvedValue(ok(connected))
    brokersAPI.getSyncStatus.mockResolvedValue(ok({}))
    brokersAPI.getPendingConflicts.mockResolvedValue(ok([]))
    brokersAPI.syncBroker.mockResolvedValue({
      data: { success: false, message: 'Token XP expirado' }
    })

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

  it('syncBroker {success:false} usa broker.id, toasta sucesso e hasError some com os cards', async () => {
    expect(wrapper.find('.corretoras-content').exists()).toBe(true)
    expect(wrapper.find('.error-container').exists()).toBe(false)
    expect(store.connectedBrokers).toHaveLength(1)

    await wrapper.vm.syncBroker(connected[0])
    await flushPromises()

    expect(brokersAPI.syncBroker).toHaveBeenCalledWith('xp')
    expect(brokersAPI.syncBroker).not.toHaveBeenCalledWith('xp-1')
    expect(store.connectedBrokers).toHaveLength(1)
    expect(store.error).toBe('Token XP expirado')
    expect(wrapper.vm.hasError).toBe(true)
    expect(wrapper.find('.error-container').exists()).toBe(true)
    expect(wrapper.find('.corretoras-content').exists()).toBe(false)
    expect(toast.success).toHaveBeenCalledWith('XP sincronizada com sucesso!')
    expect(toast.error).not.toHaveBeenCalled()
  })
})
