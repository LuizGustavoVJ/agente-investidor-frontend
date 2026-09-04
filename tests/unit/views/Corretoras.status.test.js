import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/corretoras', name: 'Corretoras', component: Corretoras },
    { path: '/corretoras/:id', name: 'CorretoraDetalhe', component: { template: '<div />' } }
  ]
})

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Corretoras — status agregado, exclusão de já conectadas e paginação', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    brokersStore.loadAllData = vi.fn().mockResolvedValue({ success: true })
    brokersStore.syncAllBrokers = vi.fn().mockResolvedValue({ success: true })
    brokersStore.connectedBrokers = []
    brokersStore.availableBrokers = []
    brokersStore.syncHistory = []

    wrapper = mount(Corretoras, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('prioriza erro sobre sync e lista vazia no status geral', () => {
    brokersStore.connectedBrokers = []
    expect(wrapper.vm.getOverallStatusClass()).toBe('disconnected')
    expect(wrapper.vm.getOverallStatusText()).toBe('Desconectado')

    brokersStore.connectedBrokers = [{ id: 'xp', status: 'syncing' }]
    expect(wrapper.vm.getOverallStatusClass()).toBe('syncing')
    expect(wrapper.vm.getOverallStatusText()).toBe('Sincronizando')

    brokersStore.connectedBrokers = [
      { id: 'xp', status: 'syncing' },
      { id: 'rico', status: 'error' }
    ]
    expect(wrapper.vm.getOverallStatusClass()).toBe('error')
    expect(wrapper.vm.getOverallStatusText()).toBe('Com Erros')
    expect(wrapper.vm.getOverallStatusDescription()).toBe('1 corretora(s) com erro')

    brokersStore.connectedBrokers = [{ id: 'xp', status: 'connected' }]
    expect(wrapper.vm.getOverallStatusClass()).toBe('connected')
    expect(wrapper.vm.getOverallStatusText()).toBe('Conectado')
  })

  it('não oferece corretora já conectada na lista de conexão', () => {
    brokersStore.availableBrokers = [
      { id: 'xp', name: 'XP' },
      { id: 'rico', name: 'Rico' }
    ]
    brokersStore.connectedBrokers = [{ id: 'xp', name: 'XP', status: 'connected' }]

    expect(wrapper.vm.availableToConnect.map((b) => b.id)).toEqual(['rico'])
  })

  it('reseta a página do histórico ao mudar o filtro', async () => {
    wrapper.vm.currentHistoryPage = 3
    wrapper.vm.selectedHistoryFilter = 'xp'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentHistoryPage).toBe(1)
  })

  it('pagina o histórico filtrado', () => {
    brokersStore.syncHistory = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      brokerId: i < 8 ? 'xp' : 'rico'
    }))
    wrapper.vm.historyPerPage = 5
    wrapper.vm.selectedHistoryFilter = 'xp'
    wrapper.vm.currentHistoryPage = 2

    expect(wrapper.vm.filteredSyncHistory).toHaveLength(8)
    expect(wrapper.vm.totalHistoryPages).toBe(2)
    expect(wrapper.vm.paginatedSyncHistory.map((e) => e.id)).toEqual([5, 6, 7])
  })

  it('exibe toast de erro quando syncAllBrokers rejeita', async () => {
    brokersStore.syncAllBrokers.mockRejectedValue(new Error('timeout'))

    await wrapper.vm.syncAllBrokers()

    expect(mockToast.error).toHaveBeenCalledWith('Erro na sincronização das corretoras')
    expect(wrapper.vm.isSyncing).toBe(false)
  })
})
