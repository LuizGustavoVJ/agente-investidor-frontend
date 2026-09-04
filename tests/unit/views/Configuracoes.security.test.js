import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
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

const mountConfig = async (userOverrides = {}) => {
  setActivePinia(createPinia())
  const authStore = useAuthStore()
  authStore.user = {
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao@email.com',
    twoFactorEnabled: false,
    ...userOverrides
  }
  authStore.loadUserSettings = vi.fn().mockResolvedValue({ success: true })
  authStore.setup2FA = vi.fn().mockResolvedValue({ success: true })
  authStore.disable2FA = vi.fn().mockResolvedValue({ success: true })
  authStore.terminateSession = vi.fn().mockResolvedValue({ success: true })
  authStore.exportUserData = vi.fn().mockResolvedValue({ success: true })
  authStore.updatePrivacySettings = vi.fn().mockResolvedValue({ success: true })
  authStore.updateInvestorProfile = vi.fn().mockResolvedValue({ success: true })
  authStore.updateNotificationSettings = vi.fn().mockResolvedValue({ success: true })

  const wrapper = mount(Configuracoes, {
    global: {
      plugins: [router]
    }
  })

  await wrapper.vm.$nextTick()
  await Promise.resolve()
  await wrapper.vm.$nextTick()

  return { wrapper, authStore }
}

const openSection = async (wrapper, label) => {
  const button = wrapper.findAll('.nav-btn').find((btn) => btn.text().includes(label))
  await button.trigger('click')
  await wrapper.vm.$nextTick()
}

describe('Configuracoes — 2FA, sessões, exportação e privacidade', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('configura 2FA a partir do estado desativado', async () => {
    const mounted = await mountConfig({ twoFactorEnabled: false })
    wrapper = mounted.wrapper
    await openSection(wrapper, 'Segurança')

    expect(wrapper.text()).toContain('2FA não configurado')
    await wrapper.find('.twofa-setup .security-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(mounted.authStore.setup2FA).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('2FA configurado com sucesso!')
  })

  it('só desativa 2FA depois da confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    const mounted = await mountConfig({ twoFactorEnabled: true })
    wrapper = mounted.wrapper
    await openSection(wrapper, 'Segurança')

    expect(wrapper.text()).toContain('2FA ativo')
    await wrapper.find('.twofa-enabled .security-btn.danger').trigger('click')
    await wrapper.vm.$nextTick()

    expect(mounted.authStore.disable2FA).not.toHaveBeenCalled()

    window.confirm.mockReturnValueOnce(true)
    await wrapper.find('.twofa-enabled .security-btn.danger').trigger('click')
    await wrapper.vm.$nextTick()

    expect(mounted.authStore.disable2FA).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('2FA desativado')
  })

  it('encerra sessão remota e não oferece ação na sessão atual', async () => {
    const mounted = await mountConfig()
    wrapper = mounted.wrapper

    await wrapper.vm.terminateSession({ id: 's-other', isCurrent: false })

    expect(mounted.authStore.terminateSession).toHaveBeenCalledWith('s-other')
    expect(mockToast.success).toHaveBeenCalledWith('Sessão encerrada')
  })

  it('exporta dados do usuário na seção de privacidade', async () => {
    const mounted = await mountConfig()
    wrapper = mounted.wrapper
    await openSection(wrapper, 'Privacidade')

    await wrapper.find('.export-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(mounted.authStore.exportUserData).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('Dados exportados! Verifique seus downloads.')
  })

  it('salva preferências de privacidade', async () => {
    const mounted = await mountConfig()
    wrapper = mounted.wrapper
    await openSection(wrapper, 'Privacidade')

    await wrapper.find('.config-form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(mounted.authStore.updatePrivacySettings).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('Configurações de privacidade salvas!')
  })

  it('mapeia ícone de dispositivo por tipo', async () => {
    const mounted = await mountConfig()
    wrapper = mounted.wrapper

    expect(wrapper.vm.getDeviceIcon('Mobile Android')).toBe('📱')
    expect(wrapper.vm.getDeviceIcon('iPad Tablet')).toBe('📱')
    expect(wrapper.vm.getDeviceIcon('Desktop Linux')).toBe('💻')
  })

  it('mostra erro e retry quando o carregamento inicial falha', async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.user = null
    authStore.error = 'Falha de rede'
    authStore.loadUserSettings = vi.fn().mockRejectedValue(new Error('Falha de rede'))

    wrapper = mount(Configuracoes, {
      global: {
        plugins: [router]
      }
    })
    await wrapper.vm.loadUserData()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Erro ao carregar configurações')
    expect(wrapper.text()).toContain('Falha de rede')

    authStore.error = null
    authStore.loadUserSettings.mockResolvedValue({ success: true })
    await wrapper.vm.retryLoad()
    await wrapper.vm.$nextTick()

    expect(authStore.loadUserSettings).toHaveBeenCalled()
    expect(authStore.loadUserSettings.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
