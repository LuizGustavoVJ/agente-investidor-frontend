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

describe('Configuracoes — e-mail sem âncora no regex e sem trim no payload', () => {
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
    authStore.updateProfile = vi.fn().mockResolvedValue({ success: true })

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('e-mail com espaços " user@x.com " passa na validação e vai cru para a store', async () => {
    wrapper.vm.profileForm.firstName = 'Maria'
    wrapper.vm.profileForm.lastName = 'Souza'
    wrapper.vm.profileForm.email = ' user@x.com '

    expect(wrapper.vm.validateProfile()).toBe(true)
    expect(wrapper.vm.profileErrors.email).toBeUndefined()

    await wrapper.vm.saveProfile()
    await flushPromises()

    expect(authStore.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ email: ' user@x.com ' })
    )
  })

  it('regex aceita "a@b.c" e texto extra com um e-mail no meio', () => {
    wrapper.vm.profileForm.firstName = 'Maria'
    wrapper.vm.profileForm.lastName = 'Souza'
    wrapper.vm.profileForm.email = 'a@b.c'
    expect(wrapper.vm.validateProfile()).toBe(true)

    wrapper.vm.profileForm.email = 'nao-e-email a@b.c extra'
    expect(wrapper.vm.validateProfile()).toBe(true)
  })
})
