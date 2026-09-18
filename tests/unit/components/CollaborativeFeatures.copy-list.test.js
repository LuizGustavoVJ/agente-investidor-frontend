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

describe('CollaborativeFeatures — copyTrader não atualiza a carteira copiada', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CollaborativeFeatures)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('liga isCopying no trader mas não insere a estratégia em copiedStrategies', () => {
    const trader = wrapper.vm.topTraders.find((item) => item.name === 'Roberto Lima')
    expect(trader).toBeTruthy()
    expect(trader.isCopying).toBe(false)

    const copiedBefore = wrapper.vm.copiedStrategies.length
    const portfolioCountBefore = wrapper.vm.socialPortfolio.copiedStrategies

    wrapper.vm.copyTrader(trader)

    expect(trader.isFollowing).toBe(true)
    expect(trader.isCopying).toBe(true)
    expect(wrapper.vm.copiedStrategies).toHaveLength(copiedBefore)
    expect(wrapper.vm.copiedStrategies.some((item) => item.traderName === 'Roberto Lima')).toBe(false)
    expect(wrapper.vm.socialPortfolio.copiedStrategies).toBe(portfolioCountBefore)
  })

  it('desligar a cópia no trader também não remove a estratégia já listada', () => {
    const ana = wrapper.vm.topTraders.find((item) => item.name === 'Ana Costa')
    expect(ana.isCopying).toBe(true)
    const copiedBefore = wrapper.vm.copiedStrategies.length

    wrapper.vm.copyTrader(ana)

    expect(ana.isCopying).toBe(false)
    expect(wrapper.vm.copiedStrategies).toHaveLength(copiedBefore)
    expect(wrapper.vm.copiedStrategies.some((item) => item.traderName === 'Ana Costa')).toBe(true)
  })
})
