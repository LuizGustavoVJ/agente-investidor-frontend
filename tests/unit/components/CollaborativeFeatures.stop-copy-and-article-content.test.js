import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CollaborativeFeatures from '@/components/CollaborativeFeatures.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    data: { datasets: [] },
    options: {}
  }))
}))

describe('CollaborativeFeatures — stopCopy e createArticle descarta conteúdo', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CollaborativeFeatures)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    wrapper?.unmount()
  })

  it('stopCopy remove da lista mas deixa trader.isCopying e o KPI copiados intactos', () => {
    const ana = wrapper.vm.topTraders.find((trader) => trader.name === 'Ana Costa')
    const growth = wrapper.vm.copiedStrategies.find((item) => item.name === 'Growth Tech Strategy')

    expect(ana.isCopying).toBe(true)
    expect(ana.isFollowing).toBe(true)
    expect(growth).toBeTruthy()
    expect(wrapper.vm.copiedStrategies).toHaveLength(2)
    expect(wrapper.vm.socialPortfolio.copiedStrategies).toBe(2)

    wrapper.vm.stopCopy(growth)

    expect(wrapper.vm.copiedStrategies).toHaveLength(1)
    expect(wrapper.vm.copiedStrategies.some((item) => item.name === 'Growth Tech Strategy')).toBe(false)
    expect(ana.isCopying).toBe(true)
    expect(ana.isFollowing).toBe(true)
    expect(wrapper.vm.socialPortfolio.copiedStrategies).toBe(2)
    expect(wrapper.vm.socialPortfolio.totalCopied).toBe(15000)
  })

  it('cancelar o confirm de stopCopy não altera a carteira copiada', () => {
    window.confirm.mockReturnValueOnce(false)
    const strategy = wrapper.vm.copiedStrategies[0]
    const lengthBefore = wrapper.vm.copiedStrategies.length

    wrapper.vm.stopCopy(strategy)

    expect(wrapper.vm.copiedStrategies).toHaveLength(lengthBefore)
    expect(wrapper.vm.copiedStrategies[0]).toBe(strategy)
  })

  it('createArticle persiste título/descrição e descarta o content digitado', () => {
    const body = 'Conteúdo completo da análise de PETR4 com tese e riscos.'
    wrapper.vm.newArticle.type = 'analysis'
    wrapper.vm.newArticle.title = 'Tese PETR4'
    wrapper.vm.newArticle.description = 'Resumo curto'
    wrapper.vm.newArticle.content = body
    wrapper.vm.newArticle.tags = 'PETR4, value'

    const countBefore = wrapper.vm.filteredKnowledge.length
    wrapper.vm.createArticle()

    expect(wrapper.vm.filteredKnowledge).toHaveLength(countBefore + 1)
    const published = wrapper.vm.filteredKnowledge[0]
    expect(published.title).toBe('Tese PETR4')
    expect(published.description).toBe('Resumo curto')
    expect(published.tags).toEqual(['PETR4', 'value'])
    expect(published).not.toHaveProperty('content')
    expect(JSON.stringify(published)).not.toContain(body)
    expect(wrapper.vm.newArticle.content).toBe('')
    expect(wrapper.vm.showNewArticleModal).toBe(false)
  })
})
