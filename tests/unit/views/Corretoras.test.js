import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/corretoras/:id', component: { template: '<div />' } },
    { path: '/corretoras/:id/configuracao', component: { template: '<div />' } }
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

vi.mock('@/api/brokers', () => ({
  brokersAPI: {
    getAvailableBrokers: vi.fn(),
    getConnectedBrokers: vi.fn(),
    connectBroker: vi.fn(),
    disconnectBroker: vi.fn(),
    syncBroker: vi.fn(),
    syncAllBrokers: vi.fn(),
    getSyncStatus: vi.fn(),
    getSyncHistory: vi.fn(),
    getPendingConflicts: vi.fn(),
    resolveDataConflict: vi.fn(),
    updateCredentials: vi.fn(),
    testConnection: vi.fn()
  }
}))

const seedStore = (store) => {
  store.availableBrokers = [
    { id: 'xp', name: 'XP Investimentos', description: 'Corretora XP', features: ['Renda variável'] },
    { id: 'rico', name: 'Rico', description: 'Corretora Rico', features: ['Tesouro'] },
    { id: 'clear', name: 'Clear', description: 'Corretora Clear', features: ['Day trade'] }
  ]
  store.connectedBrokers = [
    {
      id: 'xp',
      name: 'XP Investimentos',
      accountInfo: 'Conta 123',
      status: 'connected',
      assetsCount: 12,
      totalValue: 50000,
      lastSync: '2026-09-01T10:00:00.000Z',
      logo: ''
    },
    {
      id: 'clear',
      name: 'Clear',
      accountInfo: 'Conta 999',
      status: 'error',
      errorMessage: 'Token expirado',
      assetsCount: 3,
      totalValue: 8000,
      lastSync: '2026-08-01T10:00:00.000Z',
      logo: ''
    }
  ]
  store.syncHistory = [
    {
      id: 1,
      brokerId: 'xp',
      brokerName: 'XP Investimentos',
      brokerLogo: '',
      status: 'success',
      timestamp: '2026-09-01T10:00:00.000Z',
      assetsSynced: 12,
      duration: '2s',
      dataUpdated: 4
    }
  ]
  store.error = null
}

describe('Corretoras', () => {
  let wrapper
  let brokersStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    brokersStore.loadAllData = vi.fn().mockImplementation(async () => {
      seedStore(brokersStore)
      return { success: true }
    })
    brokersStore.syncAllBrokers = vi.fn().mockResolvedValue({ success: true })
    brokersStore.syncBroker = vi.fn().mockResolvedValue({ success: true })
    brokersStore.connectBroker = vi.fn().mockResolvedValue({ success: true })
    brokersStore.disconnectBroker = vi.fn().mockResolvedValue({ success: true })

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

  it('carrega corretoras conectadas e disponíveis', () => {
    expect(wrapper.text()).toContain('XP Investimentos')
    expect(wrapper.text()).toContain('Clear')
    expect(wrapper.text()).toContain('Rico')
    expect(wrapper.text()).toContain('Token expirado')
  })

  it('mostra status geral Com Erros quando alguma corretora falhou', () => {
    expect(wrapper.text()).toContain('Com Erros')
    expect(wrapper.text()).toContain('1 corretora(s) com erro')
  })

  it('filtra corretoras conectadas pela busca', async () => {
    await wrapper.find('.search-input').setValue('clear')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Clear')
    const connectedSection = wrapper.find('.connected-brokers-section')
    expect(connectedSection.text()).not.toContain('XP Investimentos')
  })

  it('lista apenas corretoras ainda não conectadas para nova conexão', () => {
    const availableNames = wrapper.findAll('.available-broker-card').map((card) => card.text())
    expect(availableNames.some((text) => text.includes('Rico'))).toBe(true)
    expect(availableNames.some((text) => text.includes('XP Investimentos'))).toBe(false)
  })

  it('sincroniza todas as corretoras', async () => {
    await wrapper.find('.sync-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(brokersStore.syncAllBrokers).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('Sincronização concluída!')
  })

  it('conecta corretora disponível', async () => {
    const ricoCard = wrapper.findAll('.available-broker-card').find((card) => card.text().includes('Rico'))
    await ricoCard.find('.connect-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(brokersStore.connectBroker).toHaveBeenCalledWith('rico')
    expect(mockToast.success).toHaveBeenCalledWith('Rico conectada com sucesso!')
  })

  it('pede confirmação antes de desconectar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    const xpCard = wrapper.findAll('.broker-card').find((card) => card.text().includes('XP Investimentos'))
    await xpCard.find('.disconnect-btn').trigger('click')

    expect(brokersStore.disconnectBroker).not.toHaveBeenCalled()

    window.confirm.mockReturnValue(true)
    await xpCard.find('.disconnect-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(brokersStore.disconnectBroker).toHaveBeenCalledWith('xp')
  })

  it('filtra histórico de sincronização por corretora', async () => {
    expect(wrapper.findAll('.history-entry')).toHaveLength(1)

    await wrapper.find('.filter-select').setValue('clear')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Nenhum histórico encontrado')
  })
})
