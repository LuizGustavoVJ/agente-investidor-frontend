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

describe('CollaborativeFeatures — artigo, cópia de estratégia e likes', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CollaborativeFeatures)
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    wrapper?.unmount()
  })

  it('createArticle lança TypeError se tags estiver ausente', () => {
    wrapper.vm.newArticle.title = 'Análise sem tags'
    wrapper.vm.newArticle.type = 'analysis'
    wrapper.vm.newArticle.description = 'Texto'
    wrapper.vm.newArticle.tags = undefined

    expect(() => wrapper.vm.createArticle()).toThrow(TypeError)
  })

  it('createArticle com tags vazias gera um item em branco em vez de lista vazia', () => {
    wrapper.vm.newArticle.title = 'Sem hashtags'
    wrapper.vm.newArticle.type = 'insight'
    wrapper.vm.newArticle.description = 'Descrição'
    wrapper.vm.newArticle.tags = ''

    wrapper.vm.createArticle()

    expect(wrapper.vm.filteredKnowledge[0].tags).toEqual([''])
  })

  it('copyTrader segue automaticamente quem ainda não era seguido', () => {
    const trader = wrapper.vm.topTraders.find((item) => !item.isFollowing && !item.isCopying)
    expect(trader).toBeTruthy()

    wrapper.vm.copyTrader(trader)

    expect(trader.isFollowing).toBe(true)
    expect(trader.isCopying).toBe(true)
  })

  it('deixar de seguir zera isCopying no trader mas não remove a estratégia da carteira copiada', () => {
    const trader = wrapper.vm.topTraders.find((item) => item.isFollowing && item.isCopying)
    expect(trader).toBeTruthy()
    const copiedCountBefore = wrapper.vm.copiedStrategies.length

    wrapper.vm.followTrader(trader)

    expect(trader.isFollowing).toBe(false)
    expect(trader.isCopying).toBe(false)
    expect(wrapper.vm.copiedStrategies).toHaveLength(copiedCountBefore)
  })

  it('unlike com likes em 0 deixa o contador negativo', () => {
    const item = { id: 99, likes: 0, isLiked: true }

    wrapper.vm.likeKnowledge(item)

    expect(item.isLiked).toBe(false)
    expect(item.likes).toBe(-1)
  })
})
