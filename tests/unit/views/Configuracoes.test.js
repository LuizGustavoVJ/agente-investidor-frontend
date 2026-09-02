import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

describe('Configuracoes', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.user = {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-0000',
      twoFactorEnabled: false
    }
    authStore.loadUserSettings = vi.fn().mockResolvedValue({ success: true })
    authStore.updateProfile = vi.fn().mockResolvedValue({ success: true })
    authStore.changePassword = vi.fn().mockResolvedValue({ success: true })
    authStore.deleteAccount = vi.fn().mockResolvedValue({ success: true })

    wrapper = mount(Configuracoes, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  const openSection = async (label) => {
    const button = wrapper.findAll('.nav-btn').find((btn) => btn.text().includes(label))
    await button.trigger('click')
    await wrapper.vm.$nextTick()
  }

  it('carrega o perfil pessoal a partir da store', () => {
    expect(wrapper.text()).not.toContain('Carregando configurações')
    expect(wrapper.find('#firstName').element.value).toBe('João')
    expect(wrapper.find('#email').element.value).toBe('joao@email.com')
  })

  it('valida nome, sobrenome e email obrigatórios', async () => {
    await wrapper.find('#firstName').setValue('   ')
    await wrapper.find('#lastName').setValue('')
    await wrapper.find('#email').setValue('invalido')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Nome é obrigatório')
    expect(wrapper.text()).toContain('Sobrenome é obrigatório')
    expect(wrapper.text()).toContain('Email inválido')
    expect(authStore.updateProfile).not.toHaveBeenCalled()
  })

  it('salva o perfil quando os dados são válidos', async () => {
    await wrapper.find('#firstName').setValue('Maria')
    await wrapper.find('#lastName').setValue('Souza')
    await wrapper.find('#email').setValue('maria@email.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(authStore.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Maria',
        lastName: 'Souza',
        email: 'maria@email.com'
      })
    )
    expect(mockToast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso!')
  })

  it('classifica força da nova senha', async () => {
    await openSection('Segurança')
    const newPassword = wrapper.find('#newPassword')

    await newPassword.setValue('abc')
    expect(wrapper.text()).toContain('Fraca')

    await newPassword.setValue('abcdefgh')
    expect(wrapper.text()).toContain('Regular')

    await newPassword.setValue('Abcdefgh')
    expect(wrapper.text()).toContain('Boa')

    await newPassword.setValue('Abcdefgh1')
    expect(wrapper.text()).toContain('Forte')
  })

  it('bloqueia troca de senha curta ou divergente', async () => {
    await openSection('Segurança')
    await wrapper.find('#currentPassword').setValue('atual123')
    await wrapper.find('#newPassword').setValue('123')
    await wrapper.find('#confirmPassword').setValue('outra')

    await wrapper.find('.security-form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Nova senha deve ter pelo menos 8 caracteres')
    expect(wrapper.text()).toContain('Senhas não coincidem')
    expect(authStore.changePassword).not.toHaveBeenCalled()
  })

  it('chama changePassword com senha atual e nova quando a validação passa', async () => {
    await openSection('Segurança')
    await wrapper.find('#currentPassword').setValue('atual1234')
    await wrapper.find('#newPassword').setValue('NovaSenha1')
    await wrapper.find('#confirmPassword').setValue('NovaSenha1')

    await wrapper.find('.security-form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(authStore.changePassword).toHaveBeenCalledWith('atual1234', 'NovaSenha1')
    expect(mockToast.success).toHaveBeenCalledWith('Senha alterada com sucesso!')
  })

  it('só habilita exclusão de conta após confirmar EXCLUIR', async () => {
    await openSection('Privacidade')
    await wrapper.find('.delete-btn').trigger('click')
    await wrapper.vm.$nextTick()

    const confirmBtn = wrapper.find('.modal-btn.delete-btn')
    expect(confirmBtn.attributes('disabled')).toBeDefined()

    await wrapper.find('#deleteConfirmation').setValue('excluir')
    expect(wrapper.find('.modal-btn.delete-btn').attributes('disabled')).toBeDefined()

    await wrapper.find('#deleteConfirmation').setValue('EXCLUIR')
    expect(wrapper.find('.modal-btn.delete-btn').attributes('disabled')).toBeUndefined()

    await wrapper.find('.modal-btn.delete-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(authStore.deleteAccount).toHaveBeenCalled()
  })
})
