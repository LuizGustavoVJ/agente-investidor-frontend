import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { readFileSync } from 'fs'
import { resolve } from 'path'
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

describe('Corretoras — Configurar navega para rota /configuracao inexistente', () => {
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
        { path: '/corretoras', name: 'Corretoras', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', name: 'Error404', component: { template: '<div>404</div>' } }
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
    vi.restoreAllMocks()
  })

  it('configureBroker empurra /corretoras/:id/configuracao e o router do app não declara essa rota', async () => {
    const routerSource = readFileSync(resolve(process.cwd(), 'src/router/index.js'), 'utf8')

    expect(routerSource).not.toMatch(/corretoras\/:id\/configuracao/)
    expect(routerSource).not.toContain("name: 'CorretoraConfiguracao'")
    expect(routerSource).not.toContain("name: 'BrokerConfig'")

    await wrapper.vm.configureBroker(store.connectedBrokers[0])
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/corretoras/xp-1/configuracao')
    expect(router.currentRoute.value.name).toBe('Error404')
  })
})
