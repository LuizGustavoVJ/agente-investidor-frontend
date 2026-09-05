import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
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

describe('Configuracoes — perfil de investidor, notificações e exclusão', () => {
  let wrapper
  let authStore

  const openSection = async (label) => {
    const button = wrapper.findAll('.nav-btn').find((btn) => btn.text().includes(label))
    await button.trigger('click')
    await wrapper.vm.$nextTick()
  }

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.user = {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@email.com',
      investorProfile: {
        experienceLevel: 'intermediate',
        riskProfile: 'moderate',
        monthlyIncome: '10k-to-30k',
        investmentGoal: 'retirement'
      },
      notificationSettings: {
        email: {
          weeklyReports: true,
          marketAlerts: false,
          aiRecommendations: true
        },
        push: {
          criticalAlerts: true,
          syncStatus: false
        }
      }
    }
    authStore.loadUserSettings = vi.fn().mockResolvedValue({ success: true })
    authStore.updateInvestorProfile = vi.fn().mockResolvedValue({ success: true })
    authStore.updateNotificationSettings = vi.fn().mockResolvedValue({ success: true })
    authStore.deleteAccount = vi.fn().mockResolvedValue({ success: true })

    await router.push('/configuracoes')
    wrapper = mount(Configuracoes, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('carrega o perfil de investidor e persiste as preferências', async () => {
    await openSection('Perfil de Investidor')

    expect(wrapper.vm.investorForm.experienceLevel).toBe('intermediate')
    expect(wrapper.vm.investorForm.riskProfile).toBe('moderate')

    await wrapper.find('#monthlyIncome').setValue('30k-plus')
    const form = wrapper.findAll('form').find((node) => node.html().includes('monthlyIncome'))
    await form.trigger('submit')
    await flushPromises()

    expect(authStore.updateInvestorProfile).toHaveBeenCalled()
    expect(authStore.updateInvestorProfile.mock.calls[0][0].monthlyIncome).toBe('30k-plus')
    expect(mockToast.success).toHaveBeenCalledWith('Perfil de investidor atualizado!')
  })

  it('mostra erro quando o perfil de investidor não pode ser salvo', async () => {
    authStore.updateInvestorProfile.mockRejectedValue(new Error('falha'))
    await openSection('Perfil de Investidor')

    const form = wrapper.findAll('form').find((node) => node.html().includes('monthlyIncome'))
    await form.trigger('submit')
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Erro ao salvar perfil de investidor')
  })

  it('salva configurações de notificação da seção correspondente', async () => {
    await openSection('Notificações')

    const form = wrapper.findAll('form').find((node) => node.text().includes('Salvar Notificações'))
    await form.trigger('submit')
    await flushPromises()

    expect(authStore.updateNotificationSettings).toHaveBeenCalled()
    expect(mockToast.success).toHaveBeenCalledWith('Configurações de notificação salvas!')
  })

  it('exclui a conta e volta para a home', async () => {
    wrapper.vm.deleteConfirmation = 'EXCLUIR'
    await wrapper.vm.deleteAccount()
    await flushPromises()

    expect(authStore.deleteAccount).toHaveBeenCalledTimes(1)
    expect(mockToast.success).toHaveBeenCalledWith('Conta excluída com sucesso')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('não navega quando a exclusão da conta falha', async () => {
    await router.push('/configuracoes')
    authStore.deleteAccount.mockRejectedValue(new Error('bloqueado'))

    await wrapper.vm.deleteAccount()
    await flushPromises()

    expect(mockToast.error).toHaveBeenCalledWith('Erro ao excluir conta')
    expect(router.currentRoute.value.path).toBe('/configuracoes')
  })

  it('fecha o modal de exclusão e limpa a confirmação', () => {
    wrapper.vm.showDeleteModal = true
    wrapper.vm.deleteConfirmation = 'EXCLUIR'

    wrapper.vm.closeDeleteModal()

    expect(wrapper.vm.showDeleteModal).toBe(false)
    expect(wrapper.vm.deleteConfirmation).toBe('')
  })
})
