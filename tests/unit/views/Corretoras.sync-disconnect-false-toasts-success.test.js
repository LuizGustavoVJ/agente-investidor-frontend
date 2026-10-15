import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

const xp = {
  id: 'xp-1',
  connectionId: 'conn-xp',
  name: 'XP Investimentos',
  status: 'active',
  accountInfo: 'Conta 123',
  logo: '',
  assetsCount: 10,
  totalValue: 50000,
  lastSync: '2026-10-14T10:00:00.000Z'
}

describe('Corretoras — sync/disconnect ignoram success:false e toastam sucesso', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.spyOn(store, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(store, 'syncBroker').mockResolvedValue({
      success: false,
      error: 'Timeout na corretora'
    })
    vi.spyOn(store, 'syncAllBrokers').mockResolvedValue({
      success: false,
      error: 'Falha geral de sincronização'
    })
    vi.spyOn(store, 'disconnectBroker').mockResolvedValue({
      success: false,
      error: 'Não foi possível desconectar'
    })

    store.connectedBrokers = [{ ...xp }]
    store.availableBrokers = [{ id: 'xp-1', name: 'XP Investimentos' }]

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } },
        { path: '/corretoras/:id', name: 'CorretoraDetalhe', component: { template: '<div />' } }
      ]
    })
    await router.push('/corretoras')
    await router.isReady()

    wrapper = mount(Corretoras, {
      global: { plugins: [router] }
    })
    await flushPromises()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    mockToast.info.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('syncBroker toasta sucesso e não recarrega quando a store devolve success:false', async () => {
    await wrapper.vm.syncBroker(store.connectedBrokers[0])
    await flushPromises()

    expect(store.syncBroker).toHaveBeenCalledWith('xp-1')
    expect(mockToast.info).toHaveBeenCalledWith('Sincronizando XP Investimentos...')
    expect(mockToast.success).toHaveBeenCalledWith('XP Investimentos sincronizada com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalled()
    expect(store.loadAllData).toHaveBeenCalledTimes(1)
  })

  it('syncAllBrokers toasta "Sincronização concluída" mesmo com success:false', async () => {
    await wrapper.vm.syncAllBrokers()
    await flushPromises()

    expect(store.syncAllBrokers).toHaveBeenCalled()
    expect(mockToast.info).toHaveBeenCalledWith('Sincronizando todas as corretoras...')
    expect(mockToast.success).toHaveBeenCalledWith('Sincronização concluída!')
    expect(mockToast.error).not.toHaveBeenCalled()
    expect(wrapper.vm.isSyncing).toBe(false)
  })

  it('disconnectBroker toasta sucesso, mantém a corretora na lista e não checa success:false', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    await wrapper.vm.disconnectBroker(store.connectedBrokers[0])
    await flushPromises()

    expect(store.disconnectBroker).toHaveBeenCalledWith('xp-1')
    expect(mockToast.info).toHaveBeenCalledWith('Desconectando XP Investimentos...')
    expect(mockToast.success).toHaveBeenCalledWith('XP Investimentos desconectada com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalled()
    expect(store.connectedBrokers).toHaveLength(1)
    expect(store.connectedBrokers[0].id).toBe('xp-1')
  })
})
