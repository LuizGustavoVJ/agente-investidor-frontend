import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}))

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

const missingStoreMethods = [
  'loadUserSettings',
  'updateInvestorProfile',
  'updateNotificationSettings',
  'updatePrivacySettings',
  'changePassword',
  'setup2FA',
  'disable2FA',
  'terminateSession',
  'exportUserData',
  'deleteAccount',
  'activeSessions'
]

describe('Configurações — contrato com a auth store', () => {
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div />' } },
        { path: '/configuracoes', name: 'Configuracoes', component: Configuracoes }
      ]
    })
    await router.push('/configuracoes')
    await router.isReady()
  })

  it('store não expõe os métodos de segurança e preferências que a view chama', () => {
    const store = useAuthStore()

    for (const method of missingStoreMethods) {
      expect(store[method], `${method} deveria estar ausente na store`).toBeUndefined()
    }
  })

  it('onMounted chama loadUserSettings inexistente: toast de erro, mas hasError continua falso', async () => {
    const store = useAuthStore()
    store.user = { id: 'u-1', email: 'user@email.com', firstName: 'Ana' }

    const wrapper = mount(Configuracoes, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })

    await flushPromises()

    expect(mockToast.error).toHaveBeenCalled()
    expect(store.error).toBeNull()
    expect(wrapper.text()).not.toContain('Erro ao carregar configurações')
    expect(wrapper.text()).toContain('Perfil Pessoal')

    wrapper.unmount()
  })

  it('saveProfile trata { success: false } de updateProfile como sucesso', async () => {
    const store = useAuthStore()
    store.updateProfile = vi.fn().mockResolvedValue({
      success: false,
      error: 'e-mail já em uso'
    })

    const wrapper = mount(Configuracoes, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true }
      }
    })
    await flushPromises()
    mockToast.success.mockClear()
    mockToast.error.mockClear()

    await wrapper.get('#firstName').setValue('Ana')
    await wrapper.get('#lastName').setValue('Silva')
    await wrapper.get('#email').setValue('ana@email.com')
    await wrapper.find('form.config-form').trigger('submit.prevent')
    await flushPromises()

    expect(store.updateProfile).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso!')
    expect(mockToast.error).not.toHaveBeenCalledWith('Erro ao salvar perfil')

    wrapper.unmount()
  })
})
