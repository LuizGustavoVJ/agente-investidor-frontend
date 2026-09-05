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
  routes: [
    { path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } },
    { path: '/corretoras/:id', name: 'CorretoraDetalhe', component: { template: '<div />' } },
    { path: '/corretoras/:id/configuracao', name: 'CorretoraConfig', component: { template: '<div />' } }
  ]
})

describe('Corretoras — status, sync individual e navegação', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })
    vi.spyOn(brokersStore, 'syncBroker').mockResolvedValue({ success: true })

    await router.push('/corretoras')
    wrapper = mount(Corretoras, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('mapeia classe e texto de status da corretora, inclusive desconhecido', () => {
    expect(wrapper.vm.getBrokerStatusClass('connected')).toBe('connected')
    expect(wrapper.vm.getBrokerStatusClass('syncing')).toBe('syncing')
    expect(wrapper.vm.getBrokerStatusClass('error')).toBe('error')
    expect(wrapper.vm.getBrokerStatusClass('disconnected')).toBe('disconnected')
    expect(wrapper.vm.getBrokerStatusClass('offline')).toBe('unknown')

    expect(wrapper.vm.getBrokerStatusText('connected')).toBe('Conectada')
    expect(wrapper.vm.getBrokerStatusText('syncing')).toBe('Sincronizando')
    expect(wrapper.vm.getBrokerStatusText('error')).toBe('Erro')
    expect(wrapper.vm.getBrokerStatusText('disconnected')).toBe('Desconectada')
    expect(wrapper.vm.getBrokerStatusText('offline')).toBe('Desconhecido')
  })

  it('traduz status de sincronização do histórico', () => {
    expect(wrapper.vm.getSyncStatusText('success')).toBe('Sucesso')
    expect(wrapper.vm.getSyncStatusText('error')).toBe('Erro')
    expect(wrapper.vm.getSyncStatusText('partial')).toBe('Parcial')
    expect(wrapper.vm.getSyncStatusText('cancelled')).toBe('Cancelado')
    expect(wrapper.vm.getSyncStatusText('queued')).toBe('Desconhecido')
  })

  it('descreve o status geral com a causa dominante', async () => {
    brokersStore.connectedBrokers = []
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.getOverallStatusDescription()).toBe('Nenhuma corretora conectada')

    brokersStore.connectedBrokers = [{ id: 1, status: 'connected' }]
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.getOverallStatusDescription()).toBe('Todas as corretoras funcionando')

    brokersStore.connectedBrokers = [
      { id: 1, status: 'syncing' },
      { id: 2, status: 'syncing' }
    ]
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.getOverallStatusDescription()).toBe('2 corretora(s) sincronizando')

    brokersStore.connectedBrokers = [
      { id: 1, status: 'error' },
      { id: 2, status: 'syncing' }
    ]
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.getOverallStatusDescription()).toBe('1 corretora(s) com erro')
  })

  it('trata data vazia como Nunca e time-ago vazio', () => {
    expect(wrapper.vm.formatDate(null)).toBe('Nunca')
    expect(wrapper.vm.getTimeAgo(null)).toBe('')
  })

  it('sincroniza uma corretora e mostra toast de sucesso', async () => {
    await wrapper.vm.syncBroker({ id: 'xp-1', name: 'XP' })

    expect(mockToast.info).toHaveBeenCalledWith('Sincronizando XP...')
    expect(brokersStore.syncBroker).toHaveBeenCalledWith('xp-1')
    expect(mockToast.success).toHaveBeenCalledWith('XP sincronizada com sucesso!')
  })

  it('mostra toast de erro quando a sync individual falha', async () => {
    brokersStore.syncBroker.mockRejectedValue(new Error('timeout'))

    await wrapper.vm.syncBroker({ id: 'xp-1', name: 'XP' })

    expect(mockToast.error).toHaveBeenCalledWith('Erro ao sincronizar XP')
  })

  it('navega para detalhe e configuração da corretora', async () => {
    wrapper.vm.viewBrokerDetails({ id: 42 })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/corretoras/42')

    wrapper.vm.configureBroker({ id: 42 })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/corretoras/42/configuracao')
  })
})
