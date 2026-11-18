import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CollaborativeFeatures from '@/components/CollaborativeFeatures.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn(() => ({ destroy: vi.fn(), update: vi.fn() }))
}))

describe('CollaborativeFeatures — copy trading, likes e grupos', () => {
  let wrapper
  let confirmSpy
  let alertSpy

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CollaborativeFeatures)
  })

  afterEach(() => {
    wrapper?.unmount()
    confirmSpy.mockRestore()
    alertSpy.mockRestore()
  })

  it('copyTrader força follow quando o trader ainda não é seguido', () => {
    const trader = wrapper.vm.topTraders.find(t => !t.isFollowing)
    expect(trader.isCopying).toBe(false)

    wrapper.vm.copyTrader(trader)

    expect(trader.isFollowing).toBe(true)
    expect(trader.isCopying).toBe(true)
  })

  it('deixar de seguir também desliga isCopying', () => {
    const trader = wrapper.vm.topTraders.find(t => t.isFollowing && t.isCopying)
    expect(trader).toBeTruthy()

    wrapper.vm.followTrader(trader)

    expect(trader.isFollowing).toBe(false)
    expect(trader.isCopying).toBe(false)
  })

  it('stopCopy remove a estratégia copiada mas não sincroniza trader.isCopying', () => {
    const strategy = wrapper.vm.copiedStrategies[0]
    const trader = wrapper.vm.topTraders.find(t => t.name === strategy.traderName)

    wrapper.vm.stopCopy(strategy)

    expect(wrapper.vm.copiedStrategies.find(s => s.id === strategy.id)).toBeUndefined()
    expect(trader.isCopying).toBe(true)
  })

  it('likeKnowledge concatena se likes vier como string (contrato de API frouxo)', () => {
    const item = wrapper.vm.filteredKnowledge[0]
    item.likes = '892'
    item.isLiked = false

    wrapper.vm.likeKnowledge(item)

    expect(item.isLiked).toBe(true)
    expect(item.likes).toBe('8921')
  })

  it('createTopic quebra se content for undefined (substring)', () => {
    wrapper.vm.newTopic.title = 'PETR4'
    wrapper.vm.newTopic.category = 'analysis'
    wrapper.vm.newTopic.content = undefined
    wrapper.vm.newTopic.tags = 'PETR4, petróleo'

    expect(() => wrapper.vm.createTopic()).toThrow()
  })

  it('createTopic faz split de tags e não valida campos obrigatórios', () => {
    wrapper.vm.newTopic.title = ''
    wrapper.vm.newTopic.category = ''
    wrapper.vm.newTopic.content = 'conteúdo suficiente para excerpt'
    wrapper.vm.newTopic.tags = 'a, b'

    wrapper.vm.createTopic()

    expect(wrapper.vm.filteredTopics[0].title).toBe('')
    expect(wrapper.vm.filteredTopics[0].tags).toEqual(['a', 'b'])
  })

  it('joinCompetition incrementa participantes localmente sem teto nem API', () => {
    const competition = wrapper.vm.activeCompetitions.find(c => !c.isParticipating)
    const before = competition.participants

    wrapper.vm.joinCompetition(competition)

    expect(competition.isParticipating).toBe(true)
    expect(competition.participants).toBe(before + 1)
  })

  it('leaveGroup remove o grupo só com confirm, sem persistir', () => {
    const group = wrapper.vm.myGroups[0]
    const id = group.id

    wrapper.vm.leaveGroup(group)

    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper.vm.myGroups.find(g => g.id === id)).toBeUndefined()
  })

  it('filteredKnowledge ordena in-place e devolve a mesma referência de array', () => {
    wrapper.vm.knowledgeFilter = 'all'
    wrapper.vm.knowledgeSort = 'recent'
    const originalRef = wrapper.vm.filteredKnowledge

    wrapper.vm.knowledgeSort = 'rating'
    const rated = wrapper.vm.filteredKnowledge

    expect(rated).toBe(originalRef)
    expect(rated[0].rating).toBeGreaterThanOrEqual(rated[1].rating)
  })

  it('formatPercentage usa toFixed com ponto, não locale pt-BR', () => {
    expect(wrapper.vm.formatPercentage(0.0847)).toBe('8.47%')
  })
})
