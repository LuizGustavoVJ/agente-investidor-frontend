import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — nextStep não chama validateStep', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('validateStep preenche erros do passo 0 quando os campos estão vazios', async () => {
    expect(wrapper.vm.currentStep).toBe(0)
    expect(wrapper.vm.errors.name).toBeUndefined()
    expect(wrapper.vm.errors.category).toBeUndefined()

    wrapper.vm.validateStep()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.errors.name).toBe('Nome é obrigatório')
    expect(wrapper.vm.errors.category).toBe('Categoria é obrigatória')
    expect(wrapper.vm.errors.description).toBe('Descrição é obrigatória')
    expect(wrapper.vm.errors.riskProfile).toBe('Perfil de risco é obrigatório')
    expect(wrapper.vm.errors.timeHorizon).toBe('Horizonte de investimento é obrigatório')
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })

  it('nextStep no passo 0 incompleto não avança e não popula errors — o botão Próximo não explica o bloqueio', async () => {
    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()
    expect(wrapper.find('.next-btn').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.error-message').exists()).toBe(false)

    wrapper.vm.nextStep()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentStep).toBe(0)
    expect(wrapper.vm.errors.name).toBeUndefined()
    expect(wrapper.vm.errors.category).toBeUndefined()
    expect(wrapper.vm.errors.riskProfile).toBeUndefined()
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })

  it('validateStep só valida o passo 0 — no passo de regras de entrada erros permanecem vazios', async () => {
    wrapper.vm.currentStep = 2
    wrapper.vm.methodology.entryRules = []

    wrapper.vm.validateStep()
    await wrapper.vm.$nextTick()

    expect(Object.keys(wrapper.vm.errors)).toHaveLength(0)
    expect(wrapper.vm.canProceedToNextStep()).toBe(false)
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })
})
