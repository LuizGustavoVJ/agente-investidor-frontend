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
  assetsCount: 12,
  totalValue: 150000,
  lastSync: '2026-10-22T10:00:00.000Z'
}

describe('Corretoras — status active da store vira badge Desconhecido', () => {
  let wrapper
  let router
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useBrokersStore()
    vi.spyOn(store, 'loadAllData').mockResolvedValue({ success: true })
    store.connectedBrokers = [{ ...xp }]
    store.availableBrokers = [{ id: 'xp-1', name: 'XP Investimentos' }]

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } }
      ]
    })
    await router.push('/corretoras')
    await router.isReady()

    wrapper = mount(Corretoras, {
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('card com status active mostra Desconhecido e classe unknown; o banner geral diz Conectado', () => {
    expect(store.activeBrokers).toHaveLength(1)
    expect(store.activeBrokers[0].name).toBe('XP Investimentos')

    expect(wrapper.vm.getBrokerStatusText('active')).toBe('Desconhecido')
    expect(wrapper.vm.getBrokerStatusClass('active')).toBe('unknown')
    expect(wrapper.vm.getBrokerStatusText('connected')).toBe('Conectada')

    expect(wrapper.text()).toContain('XP Investimentos')
    expect(wrapper.text()).toContain('Desconhecido')
    expect(wrapper.find('.broker-card.unknown').exists()).toBe(true)
    expect(wrapper.find('.status-badge.unknown').text()).toBe('Desconhecido')

    expect(wrapper.vm.getOverallStatusText()).toBe('Conectado')
    expect(wrapper.vm.getOverallStatusClass()).toBe('connected')
    expect(wrapper.vm.getOverallStatusDescription()).toBe(
      'Todas as corretoras funcionando'
    )
    expect(wrapper.text()).toContain('Conectado')
    expect(wrapper.text()).toContain('Todas as corretoras funcionando')
  })
})
