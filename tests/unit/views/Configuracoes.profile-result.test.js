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

describe('Configuracoes — resultado de updateProfile', () => {
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
    authStore.updateProfile = vi.fn()

    wrapper = mount(Configuracoes, {
      global: {
        plugins: [router]
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('não mostra sucesso quando a store devolve success false', async () => {
    authStore.updateProfile.mockResolvedValue({
      success: false,
      error: 'E-mail já em uso'
    })

    await wrapper.find('#firstName').setValue('Maria')
    await wrapper.find('#lastName').setValue('Souza')
    await wrapper.find('#email').setValue('maria@email.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(authStore.updateProfile).toHaveBeenCalled()
    expect(mockToast.success).not.toHaveBeenCalled()
    expect(mockToast.error).toHaveBeenCalledWith('E-mail já em uso')
  })

  it('mostra sucesso somente quando a store confirma a persistência', async () => {
    authStore.updateProfile.mockResolvedValue({ success: true })

    await wrapper.find('#firstName').setValue('Maria')
    await wrapper.find('#lastName').setValue('Souza')
    await wrapper.find('#email').setValue('maria@email.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockToast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalled()
  })
})
