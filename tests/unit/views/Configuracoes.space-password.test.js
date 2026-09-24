import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Configuracoes from '@/views/Configuracoes.vue'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Configurações — nova senha só com espaços', () => {
  let wrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    mockToast.success.mockReset()
    mockToast.error.mockReset()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/configuracoes', component: { template: '<div />' } }
      ]
    })

    wrapper = mount(Configuracoes, {
      global: { plugins: [router] }
    })
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('validatePassword aceita nova senha de 8 espaços', () => {
    wrapper.vm.passwordForm.currentPassword = 'SenhaAtual1'
    wrapper.vm.passwordForm.newPassword = '        '
    wrapper.vm.passwordForm.confirmPassword = '        '

    expect(wrapper.vm.validatePassword()).toBe(true)
    expect(wrapper.vm.passwordErrors).toEqual({})
  })

  it('medidor trata 8 espaços como senha fraca (só o critério de comprimento)', () => {
    wrapper.vm.passwordForm.newPassword = '        '

    expect(wrapper.vm.getPasswordStrengthPercent()).toBe(25)
    expect(wrapper.vm.getPasswordStrengthText()).toBe('Fraca')
  })
})
