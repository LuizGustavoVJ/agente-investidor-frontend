import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Configuracoes — notificações, privacidade e export chamam actions inexistentes', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useAuthStore()
    store.user = {
      id: 8,
      firstName: 'Lia',
      lastName: 'Costa',
      email: 'lia@exemplo.com'
    }

    mockToast.success.mockReset()
    mockToast.error.mockReset()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } },
        { path: '/', name: 'Home', component: { template: '<div />' } }
      ]
    })
    await router.push('/configuracoes')
    await router.isReady()

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await flushPromises()

    mockToast.success.mockReset()
    mockToast.error.mockReset()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('auth store não expõe updateNotificationSettings, updatePrivacySettings nem exportUserData', () => {
    expect(store.updateNotificationSettings).toBeUndefined()
    expect(store.updatePrivacySettings).toBeUndefined()
    expect(store.exportUserData).toBeUndefined()
  })

  it('saveNotifications tosta erro e nunca sucesso', async () => {
    await wrapper.vm.saveNotifications()
    await flushPromises()

    expect(mockToast.success).not.toHaveBeenCalled()
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao salvar configurações de notificação')
  })

  it('savePrivacy tosta erro e nunca sucesso', async () => {
    await wrapper.vm.savePrivacy()
    await flushPromises()

    expect(mockToast.success).not.toHaveBeenCalled()
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao salvar configurações de privacidade')
  })

  it('exportData tosta erro e nunca sucesso', async () => {
    await wrapper.vm.exportData()
    await flushPromises()

    expect(mockToast.success).not.toHaveBeenCalled()
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao exportar dados')
    expect(wrapper.vm.isExporting).toBe(false)
  })
})
