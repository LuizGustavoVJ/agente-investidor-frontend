import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Cadastro from '@/components/Cadastro.vue'
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

const passwordWithoutSymbol = 'Abcdefg1'

describe('Contrato de força de senha — Cadastro vs Configurações', () => {
  let pinia
  let router

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/cadastro', name: 'Cadastro', component: { template: '<div />' } },
        { path: '/configuracoes', name: 'Configuracoes', component: { template: '<div />' } }
      ]
    })
    await router.push('/cadastro')
    await router.isReady()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('a mesma senha é Média no Cadastro e Forte nas Configurações', async () => {
    const cadastro = mount(Cadastro, {
      global: { plugins: [pinia, router] }
    })
    cadastro.vm.form.password = passwordWithoutSymbol
    await cadastro.vm.$nextTick()

    expect(cadastro.vm.passwordStrength.percentage).toBe(65)
    expect(cadastro.vm.passwordStrength.class).toBe('medium')
    expect(cadastro.vm.passwordStrength.text).toMatch(/Média/)

    cadastro.unmount()

    const configuracoes = mount(Configuracoes, {
      global: { plugins: [pinia, router] }
    })
    await flushPromises()

    configuracoes.vm.passwordForm.newPassword = passwordWithoutSymbol
    await configuracoes.vm.$nextTick()

    expect(configuracoes.vm.getPasswordStrengthPercent()).toBe(100)
    expect(configuracoes.vm.getPasswordStrengthClass()).toBe('strong')
    expect(configuracoes.vm.getPasswordStrengthText()).toBe('Forte')

    configuracoes.unmount()
  })
})
