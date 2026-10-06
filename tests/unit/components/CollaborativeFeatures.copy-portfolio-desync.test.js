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

describe('CollaborativeFeatures — copy/follow não sincroniza a carteira social', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CollaborativeFeatures)
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    wrapper?.unmount()
  })

  it('copyTrader liga isCopying mas não inclui a estratégia em copiedStrategies nem soma o valor copiado', () => {
    const trader = wrapper.vm.topTraders.find((item) => item.id === 3)
    expect(trader).toBeTruthy()
    expect(trader.isFollowing).toBe(false)
    expect(trader.isCopying).toBe(false)

    const copiedListBefore = wrapper.vm.copiedStrategies.map((item) => item.id)
    const copiedCountBefore = wrapper.vm.socialPortfolio.copiedStrategies
    const totalCopiedBefore = wrapper.vm.socialPortfolio.totalCopied
    const followedBefore = wrapper.vm.socialPortfolio.followedTraders

    wrapper.vm.copyTrader(trader)

    expect(trader.isFollowing).toBe(true)
    expect(trader.isCopying).toBe(true)
    expect(wrapper.vm.copiedStrategies.map((item) => item.id)).toEqual(copiedListBefore)
    expect(wrapper.vm.socialPortfolio.copiedStrategies).toBe(copiedCountBefore)
    expect(wrapper.vm.socialPortfolio.totalCopied).toBe(totalCopiedBefore)
    expect(wrapper.vm.socialPortfolio.followedTraders).toBe(followedBefore)
    expect(wrapper.vm.copiedStrategies.some((item) => item.traderName === trader.name)).toBe(false)
  })

  it('followTrader não atualiza o contador de traders seguidos do resumo', () => {
    const trader = wrapper.vm.topTraders.find((item) => !item.isFollowing)
    expect(trader).toBeTruthy()
    const followedBefore = wrapper.vm.socialPortfolio.followedTraders

    wrapper.vm.followTrader(trader)

    expect(trader.isFollowing).toBe(true)
    expect(wrapper.vm.socialPortfolio.followedTraders).toBe(followedBefore)
  })

  it('stopCopy remove da lista mas deixa copiedStrategies e totalCopied do resumo stale', () => {
    const strategy = wrapper.vm.copiedStrategies[0]
    const amount = strategy.amount
    const id = strategy.id
    const copiedCountBefore = wrapper.vm.socialPortfolio.copiedStrategies
    const totalCopiedBefore = wrapper.vm.socialPortfolio.totalCopied

    wrapper.vm.stopCopy(strategy)

    expect(wrapper.vm.copiedStrategies.find((item) => item.id === id)).toBeUndefined()
    expect(wrapper.vm.socialPortfolio.copiedStrategies).toBe(copiedCountBefore)
    expect(wrapper.vm.socialPortfolio.totalCopied).toBe(totalCopiedBefore)
    expect(wrapper.vm.socialPortfolio.totalCopied).not.toBe(totalCopiedBefore - amount)
  })
})
