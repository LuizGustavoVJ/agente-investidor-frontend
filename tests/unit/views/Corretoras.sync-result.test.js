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

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/corretoras', name: 'Corretoras', component: Corretoras }]
})

describe('Corretoras — sync, IDs e métricas ausentes', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'syncAllBrokers').mockResolvedValue({ success: true })

    wrapper = mount(Corretoras, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    mockToast.info.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('celebra sincronização geral mesmo quando a store devolve success false', async () => {
    brokersStore.syncAllBrokers.mockResolvedValue({
      success: false,
      error: 'Timeout na XP'
    })

    await wrapper.vm.syncAllBrokers()
    await flushPromises()

    expect(mockToast.success).toHaveBeenCalledWith('Sincronização concluída!')
    expect(mockToast.error).not.toHaveBeenCalled()
  })

  it('totalSyncedAssets fica em 0 porque a store não expõe essa métrica', () => {
    expect(brokersStore.totalSyncedAssets).toBeUndefined()
    expect(wrapper.vm.totalSyncedAssets).toBe(0)

    brokersStore.connectedBrokers = [
      { id: 'xp', assetsCount: 12, totalValue: 50000, status: 'active' }
    ]
    expect(wrapper.vm.totalSyncedAssets).toBe(0)
  })

  it('availableToConnect compara id da UI, não brokerId da conexão', async () => {
    brokersStore.connectedBrokers = [
      { id: 'conn-1', brokerId: 'xp', name: 'XP Conta 1', status: 'active' }
    ]
    brokersStore.availableBrokers = [
      { id: 'xp', name: 'XP' },
      { id: 'clear', name: 'Clear' }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.availableToConnect.map((broker) => broker.id)).toEqual(['xp', 'clear'])
  })

  it('status ativo da store aparece como desconhecido na view', () => {
    expect(wrapper.vm.getBrokerStatusClass('active')).toBe('unknown')
    expect(wrapper.vm.getBrokerStatusText('active')).toBe('Desconhecido')
  })
})
