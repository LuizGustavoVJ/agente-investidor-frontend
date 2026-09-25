import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div />' } },
    { path: '/configuracoes', name: 'Configuracoes', component: Configuracoes }
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

describe('Configuracoes — confirmação de exclusão é case-sensitive', () => {
  let wrapper
  let authStore

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

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  const deleteButton = () =>
    wrapper.findAll('button').find((button) => button.text().includes('Excluir Conta'))

  it('botão permanece desabilitado para "excluir", "EXCLUIR " e vazio', async () => {
    wrapper.vm.showDeleteModal = true
    await wrapper.vm.$nextTick()

    for (const value of ['', 'excluir', 'EXCLUIR ', ' EXCLUIR']) {
      wrapper.vm.deleteConfirmation = value
      await wrapper.vm.$nextTick()
      expect(deleteButton().attributes('disabled')).toBeDefined()
    }
    expect(authStore.deleteAccount).not.toHaveBeenCalled()
  })

  it('só "EXCLUIR" exato habilita o botão', async () => {
    wrapper.vm.showDeleteModal = true
    wrapper.vm.deleteConfirmation = 'EXCLUIR'
    await wrapper.vm.$nextTick()

    expect(deleteButton().attributes('disabled')).toBeUndefined()
  })
})
