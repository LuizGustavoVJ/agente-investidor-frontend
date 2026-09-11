import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import Corretoras from '@/views/Corretoras.vue'
import { useBrokersStore } from '@/stores/brokers'

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

const routerSource = readFileSync(resolve(__dirname, '../../../src/router/index.js'), 'utf8')

describe('Corretoras — ativos sincronizados, status e rotas aninhadas', () => {
  let wrapper
  let brokersStore
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokersStore = useBrokersStore()
    vi.spyOn(brokersStore, 'loadAllData').mockResolvedValue({ success: true })

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

  it('totalSyncedAssets não existe na store: a view mostra 0 mesmo com ativos nas corretoras', async () => {
    expect(brokersStore.totalSyncedAssets).toBeUndefined()

    brokersStore.connectedBrokers = [
      { id: 'xp', name: 'XP', status: 'active', assetsCount: 12, totalValue: 50000 },
      { id: 'clear', name: 'Clear', status: 'active', assetsCount: 8, totalValue: 20000 }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.totalSyncedAssets).toBe(0)
    expect(wrapper.text()).toContain('0')
  })

  it('status active da store não mapeia para conectada na view', () => {
    expect(wrapper.vm.getBrokerStatusClass('active')).toBe('unknown')
    expect(wrapper.vm.getBrokerStatusText('active')).toBe('Desconhecido')

    brokersStore.connectedBrokers = [
      { id: 'xp', name: 'XP', status: 'active', connectionId: 'conn-1' }
    ]
    expect(brokersStore.activeBrokers).toHaveLength(1)
    expect(wrapper.vm.getOverallStatusText()).toBe('Conectado')
  })

  it('availableToConnect compara id, então brokerId da conexão não esconde a corretora já ligada', async () => {
    brokersStore.connectedBrokers = [
      { connectionId: 'conn-xp', brokerId: 'xp', name: 'XP Investimentos', status: 'active' }
    ]
    brokersStore.availableBrokers = [
      { id: 'xp', name: 'XP Investimentos' },
      { id: 'clear', name: 'Clear' }
    ]
    await wrapper.vm.$nextTick()

    const availableIds = wrapper.vm.availableToConnect.map((b) => b.id)
    expect(availableIds).toContain('xp')
    expect(availableIds).toContain('clear')
  })

  it('detalhe e configuração de corretora não existem no router real', () => {
    expect(routerSource).not.toMatch(/path:\s*'\/corretoras\/:/)
    expect(routerSource).not.toContain('/corretoras/:id')
    expect(routerSource).not.toContain("name: 'CorretoraDetalhe'")
    expect(routerSource).not.toContain("name: 'CorretoraConfig'")
  })
})
