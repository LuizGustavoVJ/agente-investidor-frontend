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

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('Configuracoes — loadUserSettings ausente deixa formulário vazio sem erro de tela', () => {
  let wrapper
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    mockToast.error.mockReset()

    store.user = {
      id: 7,
      firstName: 'Carlos',
      lastName: 'Souza',
      email: 'carlos@exemplo.com',
      phone: '(21) 98888-7777',
      bio: 'Perfil existente'
    }
    store.error = null

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } }
      ]
    })

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('falha no load não aciona hasError e o form fica em branco para sobrescrever o perfil', async () => {
    expect(store.loadUserSettings).toBeUndefined()
    expect(wrapper.vm.isInitialLoading).toBe(false)
    expect(wrapper.vm.hasError).toBe(false)
    expect(store.error).toBeNull()
    expect(wrapper.vm.profileForm.firstName).toBe('')
    expect(wrapper.vm.profileForm.lastName).toBe('')
    expect(wrapper.vm.profileForm.email).toBe('')
    expect(wrapper.vm.profileForm.bio).toBe('')
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao carregar configurações')
    expect(wrapper.find('.error-container').exists()).toBe(false)
    expect(wrapper.find('#firstName').exists()).toBe(true)
  })
})
