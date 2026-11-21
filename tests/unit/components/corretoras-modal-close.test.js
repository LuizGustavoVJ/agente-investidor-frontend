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
    getAvailableBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getConnectedBrokers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getSyncStatus: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    getPendingConflicts: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncHistory: vi.fn()
  }
}))

import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/corretoras', component: { template: '<div />' } }
  ]
})

describe('Corretoras: modal fecha no falha e rotas filhas inexistentes', () => {
  let wrapper
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
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

  it('connectSelectedBroker fecha o modal mesmo com { success: false } e sem throw', async () => {
    const store = useBrokersStore()
    store.availableBrokers = [
      { id: 'xp', name: 'XP', description: 'Corretora', logo: '' }
    ]
    store.connectedBrokers = []
    store.connectBroker = vi.fn().mockResolvedValue({ success: false, error: 'credenciais' })

    wrapper.vm.showAddBrokerModal = true
    wrapper.vm.selectedBrokerToAdd = 'xp'
    await wrapper.vm.$nextTick()

    await wrapper.vm.connectSelectedBroker()

    expect(store.connectBroker).toHaveBeenCalledWith('xp')
    expect(toast.success).toHaveBeenCalled()
    expect(wrapper.vm.showAddBrokerModal).toBe(false)
    expect(wrapper.vm.selectedBrokerToAdd).toBeNull()
  })

  it('configureBroker e viewBrokerDetails empurram rotas que o router não declara', async () => {
    const push = vi.spyOn(router, 'push').mockResolvedValue()
    const broker = { id: 42, name: 'Clear' }

    wrapper.vm.configureBroker(broker)
    wrapper.vm.viewBrokerDetails(broker)

    expect(push).toHaveBeenCalledWith('/corretoras/42/configuracao')
    expect(push).toHaveBeenCalledWith('/corretoras/42')

    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    const routerSrc = readFileSync(
      resolve(__dirname, '../../../src/router/index.js'),
      'utf8'
    )
    expect(routerSrc).not.toMatch(/\/corretoras\/:id/)
    expect(routerSrc).not.toMatch('configuracao')
  })

  it('connectBroker da view passa o id primitivo, não o payload { brokerId, credentials }', async () => {
    const store = useBrokersStore()
    store.connectBroker = vi.fn().mockResolvedValue({ success: true })

    await wrapper.vm.connectBroker({ id: 'btg', name: 'BTG' })

    expect(store.connectBroker).toHaveBeenCalledWith('btg')
    expect(store.connectBroker.mock.calls[0][0]).not.toEqual(
      expect.objectContaining({ brokerId: 'btg' })
    )
  })
})
