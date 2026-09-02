import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder', () => {
  let wrapper
  let alertSpy
  let confirmSpy

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true)
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
    alertSpy.mockRestore()
    confirmSpy.mockRestore()
  })

  const fillBasicInfo = async () => {
    wrapper.vm.methodology.name = 'Value Conservador'
    wrapper.vm.methodology.category = 'value'
    wrapper.vm.methodology.description = 'Ações baratas com margem de segurança'
    wrapper.vm.methodology.riskProfile = 'conservative'
    wrapper.vm.methodology.timeHorizon = 'long'
    await wrapper.vm.$nextTick()
  }

  it('bloqueia o avanço do wizard sem informações básicas', () => {
    expect(wrapper.vm.currentStep).toBe(0)
    expect(wrapper.vm.canProceedToNextStep()).toBeFalsy()
    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(0)
  })

  it('preenche erros do passo 1 quando campos obrigatórios faltam', () => {
    wrapper.vm.validateStep()

    expect(wrapper.vm.errors.name).toBe('Nome é obrigatório')
    expect(wrapper.vm.errors.category).toBe('Categoria é obrigatória')
    expect(wrapper.vm.errors.description).toBe('Descrição é obrigatória')
    expect(wrapper.vm.errors.riskProfile).toBe('Perfil de risco é obrigatório')
    expect(wrapper.vm.errors.timeHorizon).toBe('Horizonte de investimento é obrigatório')
  })

  it('avança para critérios depois das informações básicas', async () => {
    await fillBasicInfo()

    expect(wrapper.vm.canProceedToNextStep()).toBeTruthy()
    wrapper.vm.nextStep()
    expect(wrapper.vm.currentStep).toBe(1)
  })

  it('não considera a metodologia válida sem regras de entrada', async () => {
    await fillBasicInfo()

    expect(wrapper.vm.isMethodologyValid).toBe(false)
    expect(wrapper.vm.validationResults.find((r) => r.id === 'entry_rules').status).toBe('error')
  })

  it('ativa e desativa critérios fundamentalistas com peso padrão', async () => {
    const pe = wrapper.vm.availableCriteria.find((c) => c.id === 'pe_ratio')

    wrapper.vm.toggleCriterion(pe)
    expect(wrapper.vm.isCriterionActive('pe_ratio')).toBe(true)
    expect(wrapper.vm.getCriterionConfig('pe_ratio')).toMatchObject({
      id: 'pe_ratio',
      operator: 'lt',
      weight: 50
    })
    expect(wrapper.vm.getCriterionName('pe_ratio')).toBe('P/L (Price/Earnings)')
    expect(wrapper.vm.getOperatorLabel('pe_ratio', 'lt')).toBe('Menor que')

    wrapper.vm.toggleCriterion(pe)
    expect(wrapper.vm.isCriterionActive('pe_ratio')).toBe(false)
    expect(wrapper.vm.methodology.criteria).toHaveLength(0)
  })

  it('exige ao menos uma regra de entrada no passo 3', async () => {
    await fillBasicInfo()
    wrapper.vm.currentStep = 2

    expect(wrapper.vm.canProceedToNextStep()).toBe(false)

    wrapper.vm.addRule('entry')
    expect(wrapper.vm.methodology.entryRules).toHaveLength(1)
    expect(wrapper.vm.canProceedToNextStep()).toBe(true)

    wrapper.vm.removeRule('entry', 0)
    expect(wrapper.vm.methodology.entryRules).toHaveLength(0)
  })

  it('lista indicadores de acordo com o tipo da regra', () => {
    const technical = wrapper.vm.getIndicatorsByType('technical').map((i) => i.value)
    expect(technical).toEqual(expect.arrayContaining(['sma_20', 'rsi', 'macd']))
    expect(wrapper.vm.getIndicatorsByType('unknown')).toEqual([])
  })

  it('clona metodologia com sufixo e reseta o wizard', () => {
    const saved = {
      id: 99,
      name: 'Momentum',
      category: 'momentum',
      description: 'Seguir tendência'
    }

    wrapper.vm.currentStep = 4
    wrapper.vm.cloneMethodology(saved)

    expect(wrapper.vm.methodology.name).toBe('Momentum (Cópia)')
    expect(wrapper.vm.methodology.id).toBeUndefined()
    expect(wrapper.vm.currentStep).toBe(0)
  })

  it('exclui metodologia salva após confirmação', () => {
    const initialCount = wrapper.vm.savedMethodologies.length
    const target = wrapper.vm.savedMethodologies[0]

    wrapper.vm.deleteMethodology(target)

    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper.vm.savedMethodologies).toHaveLength(initialCount - 1)
    expect(wrapper.vm.savedMethodologies.find((m) => m.id === target.id)).toBeUndefined()
  })

  it('formata percentual e números usados no backtest', () => {
    expect(wrapper.vm.formatPercentage(0.1847)).toBe('18.47%')
    expect(wrapper.vm.formatNumber(1.2)).toBe('1.20')
  })

  it('mapeia labels de categoria, risco, horizonte e status', () => {
    expect(wrapper.vm.getCategoryLabel('value')).toBe('Value Investing')
    expect(wrapper.vm.getRiskProfileLabel('aggressive')).toBe('Agressivo')
    expect(wrapper.vm.getTimeHorizonLabel('long')).toBe('Longo Prazo')
    expect(wrapper.vm.getStatusLabel('testing')).toBe('Em Teste')
  })

  it('salva metodologia ativa e limpa o formulário', async () => {
    await fillBasicInfo()
    wrapper.vm.addRule('entry')
    wrapper.vm.saveMethodology()

    const saved = wrapper.vm.savedMethodologies.at(-1)
    expect(saved.status).toBe('active')
    expect(saved.name).toBe('Value Conservador')
    expect(wrapper.vm.methodology.name).toBe('')
    expect(wrapper.vm.currentStep).toBe(0)
    expect(alertSpy).toHaveBeenCalled()
  })
})
