import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => toast
}))

describe('Configuracoes: clone raso e força de senha', () => {
  let wrapper
  let authStore
  let router

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()
    authStore.user = {
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@ex.com',
      notificationSettings: {
        email: { weeklyReports: true, marketAlerts: true }
      },
      investorProfile: {
        experienceLevel: 'beginner',
        nested: { a: 1 }
      }
    }
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }]
    })
    wrapper = mount(Configuracoes, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('clone raso de notificationSettings muta o user da store', async () => {
    const store = useAuthStore()
    store.loadUserSettings = vi.fn().mockResolvedValue(undefined)
    store.user = {
      email: 'ana@ex.com',
      notificationSettings: {
        email: { weeklyReports: true }
      }
    }

    await wrapper.vm.loadUserData()

    wrapper.vm.notificationsForm.email.weeklyReports = false

    expect(store.user.notificationSettings.email.weeklyReports).toBe(false)
  })

  it('clone raso de investorProfile compartilha objetos aninhados', async () => {
    const store = useAuthStore()
    store.loadUserSettings = vi.fn().mockResolvedValue(undefined)
    store.user = {
      email: 'ana@ex.com',
      investorProfile: { experienceLevel: 'beginner', nested: { a: 1 } }
    }

    await wrapper.vm.loadUserData()
    wrapper.vm.investorForm.nested.a = 99

    expect(store.user.investorProfile.nested.a).toBe(99)
  })

  it('força da senha ignora símbolos (diferente do cadastro)', () => {
    wrapper.vm.passwordForm.newPassword = '!!!!!!!!'
    expect(wrapper.vm.getPasswordStrengthPercent()).toBe(25)

    wrapper.vm.passwordForm.newPassword = 'Password1'
    expect(wrapper.vm.getPasswordStrengthPercent()).toBe(100)
  })

  it('validateProfile não valida telefone nem data de nascimento', () => {
    wrapper.vm.profileForm.firstName = 'Ana'
    wrapper.vm.profileForm.lastName = 'Silva'
    wrapper.vm.profileForm.email = 'ana@ex.com'
    wrapper.vm.profileForm.phone = 'abc'
    wrapper.vm.profileForm.birthDate = 'not-a-date'

    expect(wrapper.vm.validateProfile()).toBe(true)
    expect(wrapper.vm.profileErrors.phone).toBeUndefined()
    expect(wrapper.vm.profileErrors.birthDate).toBeUndefined()
  })

  it('changePassword chama a store com 2 argumentos e sem confirmPassword', async () => {
    const store = useAuthStore()
    store.changePassword = vi.fn().mockResolvedValue({ success: true })
    wrapper.vm.passwordForm.currentPassword = 'oldpass1'
    wrapper.vm.passwordForm.newPassword = 'Newpass12'
    wrapper.vm.passwordForm.confirmPassword = 'Newpass12'

    await wrapper.vm.changePassword()

    expect(store.changePassword).toHaveBeenCalledWith('oldpass1', 'Newpass12')
    expect(store.changePassword.mock.calls[0]).toHaveLength(2)
  })
})
