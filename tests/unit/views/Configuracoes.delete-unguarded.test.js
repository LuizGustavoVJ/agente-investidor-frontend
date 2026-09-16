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

describe('Configuracoes — exclusão de conta sem conferir a confirmação', () => {
  let wrapper
  let authStore
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.user = {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@email.com'
    }
    authStore.loadUserSettings = vi.fn().mockResolvedValue({ success: true })
    authStore.deleteAccount = vi.fn().mockResolvedValue({ success: true })

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div />' } },
        { path: '/configuracoes', name: 'Configuracoes', component: Configuracoes }
      ]
    })

    await router.push('/configuracoes')
    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('deleteAccount exclui mesmo com confirmação vazia — o guard está só no botão', async () => {
    wrapper.vm.deleteConfirmation = ''

    await wrapper.vm.deleteAccount()
    await flushPromises()

    expect(authStore.deleteAccount).toHaveBeenCalledTimes(1)
    expect(mockToast.success).toHaveBeenCalledWith('Conta excluída com sucesso')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('deleteAccount também aceita texto diferente de EXCLUIR', async () => {
    wrapper.vm.deleteConfirmation = 'apagar'

    await wrapper.vm.deleteAccount()
    await flushPromises()

    expect(authStore.deleteAccount).toHaveBeenCalledTimes(1)
  })
})
