import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrokersStore } from '@/stores/brokers'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}
const mockPush = vi.fn()

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

const brokersAPI = vi.hoisted(() => ({
  getAvailableBrokers: vi.fn(),
  getConnectedBrokers: vi.fn(),
  getSyncStatus: vi.fn(),
  getPendingConflicts: vi.fn(),
  connectBroker: vi.fn(),
  disconnectBroker: vi.fn(),
  syncBroker: vi.fn(),
  syncAllBrokers: vi.fn()
}))

vi.mock('@/api/brokers', () => ({ brokersAPI }))

import Corretoras from '@/views/Corretoras.vue'

const ok = (data = []) => ({ data: { success: true, data } })

describe('Corretoras — identidade, payload e status', () => {
  let wrapper
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.clearAllMocks()
    brokersAPI.getAvailableBrokers.mockResolvedValue(ok([]))
    brokersAPI.getConnectedBrokers.mockResolvedValue(ok([]))
    brokersAPI.getSyncStatus.mockResolvedValue(ok({}))
    brokersAPI.getPendingConflicts.mockResolvedValue(ok([]))
    brokersAPI.connectBroker.mockResolvedValue(ok({ connectionId: 'conn-1' }))
    brokersAPI.disconnectBroker.mockResolvedValue(ok({}))
    brokersAPI.syncBroker.mockResolvedValue(ok({}))

    wrapper = mount(Corretoras, {
      global: {
        stubs: { 'router-link': true }
      }
    })
    wrapper.vm.isInitialLoading = false
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('sync e disconnect usam broker.id, não connectionId', async () => {
    const broker = {
      id: 99,
      connectionId: 'conn-xp',
      name: 'XP',
      status: 'active'
    }
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    await wrapper.vm.syncBroker(broker)
    await wrapper.vm.disconnectBroker(broker)

    expect(brokersAPI.syncBroker).toHaveBeenCalledWith(99)
    expect(brokersAPI.disconnectBroker).toHaveBeenCalledWith(99)
    expect(brokersAPI.syncBroker).not.toHaveBeenCalledWith('conn-xp')
    confirmSpy.mockRestore()
  })

  it('connectBroker na view passa só o id; a API recebe payload sem brokerId', async () => {
    await wrapper.vm.connectBroker({ id: 'xp', name: 'XP Investimentos' })

    expect(brokersAPI.connectBroker).toHaveBeenCalledWith('xp')
    const sent = brokersAPI.connectBroker.mock.calls[0][0]
    expect(sent).toBe('xp')
    expect(sent).not.toEqual(expect.objectContaining({
      brokerId: expect.anything(),
      credentials: expect.anything()
    }))
  })

  it('availableToConnect compara id, então connectionId diferente não esconde corretora já ligada', () => {
    store.connectedBrokers = [{ id: 'conn-1', connectionId: 'xp', name: 'XP' }]
    store.availableBrokers = [
      { id: 'xp', name: 'XP' },
      { id: 'rico', name: 'Rico' }
    ]

    expect(wrapper.vm.availableToConnect.map((b) => b.id)).toEqual(['xp', 'rico'])
  })

  it('status active da store cai no fallback Desconhecido da view', () => {
    expect(wrapper.vm.getBrokerStatusClass('active')).toBe('unknown')
    expect(wrapper.vm.getBrokerStatusText('active')).toBe('Desconhecido')
    expect(wrapper.vm.getBrokerStatusClass('connected')).toBe('connected')
  })

  it('totalSyncedAssets fica 0 porque a store não expõe o getter', () => {
    store.connectedBrokers = [{ id: 1, assetsCount: 12, name: 'XP' }]

    expect(store.totalSyncedAssets).toBeUndefined()
    expect(wrapper.vm.totalSyncedAssets).toBe(0)
  })

  it('busca quebra se a corretora não tiver name', () => {
    store.connectedBrokers = [{ id: 1, connectionId: 'xp', accountInfo: 'conta' }]
    wrapper.vm.searchTerm = 'xp'

    expect(() => wrapper.vm.filteredConnectedBrokers).toThrow()
  })

  it('navega para rotas aninhadas que o router não declara', () => {
    wrapper.vm.viewBrokerDetails({ id: 7 })
    wrapper.vm.configureBroker({ id: 7 })

    expect(mockPush).toHaveBeenCalledWith('/corretoras/7')
    expect(mockPush).toHaveBeenCalledWith('/corretoras/7/configuracao')
  })
})
