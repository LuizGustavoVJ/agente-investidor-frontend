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

describe('CollaborativeFeatures — copyTrader, followTrader e joinCompetition dessincronizam estado', () => {
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

  it('copyTrader marca isCopying mas não entra na lista nem atualiza o KPI de capital copiado', () => {
    const roberto = wrapper.vm.topTraders.find((trader) => trader.name === 'Roberto Lima')

    expect(roberto.isCopying).toBe(false)
    expect(roberto.isFollowing).toBe(false)
    expect(wrapper.vm.copiedStrategies.some((item) => item.traderName === 'Roberto Lima')).toBe(false)
    expect(wrapper.vm.copiedStrategies).toHaveLength(2)
    expect(wrapper.vm.socialPortfolio.copiedStrategies).toBe(2)
    expect(wrapper.vm.socialPortfolio.totalCopied).toBe(15000)
    expect(wrapper.vm.socialPortfolio.followedTraders).toBe(5)

    wrapper.vm.copyTrader(roberto)

    expect(roberto.isFollowing).toBe(true)
    expect(roberto.isCopying).toBe(true)
    expect(wrapper.vm.copiedStrategies).toHaveLength(2)
    expect(wrapper.vm.copiedStrategies.some((item) => item.traderName === 'Roberto Lima')).toBe(false)
    expect(wrapper.vm.socialPortfolio.copiedStrategies).toBe(2)
    expect(wrapper.vm.socialPortfolio.totalCopied).toBe(15000)
    expect(wrapper.vm.socialPortfolio.followedTraders).toBe(5)
    expect(roberto.followers).toBe(12750)
  })

  it('deixar de seguir zera isCopying e deixa a estratégia na carteira copiada', () => {
    const ana = wrapper.vm.topTraders.find((trader) => trader.name === 'Ana Costa')
    const growth = wrapper.vm.copiedStrategies.find((item) => item.name === 'Growth Tech Strategy')

    expect(ana.isFollowing).toBe(true)
    expect(ana.isCopying).toBe(true)
    expect(growth).toBeTruthy()
    expect(wrapper.vm.socialPortfolio.followedTraders).toBe(5)
    expect(wrapper.vm.socialPortfolio.copiedStrategies).toBe(2)

    wrapper.vm.followTrader(ana)

    expect(ana.isFollowing).toBe(false)
    expect(ana.isCopying).toBe(false)
    expect(wrapper.vm.copiedStrategies).toHaveLength(2)
    expect(wrapper.vm.copiedStrategies.some((item) => item.name === 'Growth Tech Strategy')).toBe(true)
    expect(wrapper.vm.socialPortfolio.followedTraders).toBe(5)
    expect(wrapper.vm.socialPortfolio.copiedStrategies).toBe(2)
    expect(wrapper.vm.socialPortfolio.totalCopied).toBe(15000)
  })

  it('joinCompetition não adiciona em myCompetitions — a seção Minhas Competições fica stale', () => {
    const weekly = wrapper.vm.activeCompetitions.find((item) => item.title === 'Trading Semanal')
    const mineBefore = wrapper.vm.myCompetitions.map((item) => item.title)

    expect(weekly.isParticipating).toBe(false)
    expect(weekly.participants).toBe(456)
    expect(mineBefore).toEqual(['Desafio Value Investing 2024'])

    wrapper.vm.joinCompetition(weekly)

    expect(weekly.isParticipating).toBe(true)
    expect(weekly.participants).toBe(457)
    expect(wrapper.vm.myCompetitions).toHaveLength(1)
    expect(wrapper.vm.myCompetitions.map((item) => item.title)).toEqual(mineBefore)
    expect(wrapper.vm.myCompetitions.some((item) => item.title === 'Trading Semanal')).toBe(false)
    expect(window.alert).toHaveBeenCalledWith('Você se inscreveu na competição: Trading Semanal')
  })
})
