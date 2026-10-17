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

describe('CollaborativeFeatures — criar grupo/competição sem modal e join duplicado', () => {
  let wrapper

  beforeEach(async () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = mount(CollaborativeFeatures)
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    wrapper?.unmount()
  })

  it('Criar Grupo liga o flag e não abre modal nem altera myGroups', async () => {
    wrapper.vm.activeTab = 'groups'
    await wrapper.vm.$nextTick()

    const mineBefore = wrapper.vm.myGroups.map((group) => group.name)
    const recommendedBefore = wrapper.vm.recommendedGroups.map((group) => group.name)

    expect(wrapper.vm.showNewGroupModal).toBe(false)
    expect(wrapper.find('.new-group-modal').exists()).toBe(false)
    expect(typeof wrapper.vm.createGroup).toBe('undefined')

    await wrapper.find('.new-group-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showNewGroupModal).toBe(true)
    expect(wrapper.find('.new-group-modal').exists()).toBe(false)
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/nome do grupo|criar grupo de investimento/i)
    expect(wrapper.vm.myGroups.map((group) => group.name)).toEqual(mineBefore)
    expect(wrapper.vm.recommendedGroups.map((group) => group.name)).toEqual(recommendedBefore)
  })

  it('Criar Competição liga o flag e não abre modal nem altera as listas', async () => {
    wrapper.vm.activeTab = 'competitions'
    await wrapper.vm.$nextTick()

    const activeBefore = wrapper.vm.activeCompetitions.map((item) => item.title)
    const mineBefore = wrapper.vm.myCompetitions.map((item) => item.title)

    expect(wrapper.vm.showNewCompetitionModal).toBe(false)
    expect(wrapper.find('.new-competition-modal').exists()).toBe(false)
    expect(typeof wrapper.vm.createCompetition).toBe('undefined')

    await wrapper.find('.new-competition-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showNewCompetitionModal).toBe(true)
    expect(wrapper.find('.new-competition-modal').exists()).toBe(false)
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    expect(wrapper.vm.activeCompetitions.map((item) => item.title)).toEqual(activeBefore)
    expect(wrapper.vm.myCompetitions.map((item) => item.title)).toEqual(mineBefore)
  })

  it('joinCompetition duas vezes incrementa participantes de novo e não entra em myCompetitions', () => {
    const weekly = wrapper.vm.activeCompetitions.find((item) => item.title === 'Trading Semanal')

    expect(weekly.isParticipating).toBe(false)
    expect(weekly.participants).toBe(456)
    expect(wrapper.vm.myCompetitions).toHaveLength(1)

    wrapper.vm.joinCompetition(weekly)
    wrapper.vm.joinCompetition(weekly)

    expect(weekly.isParticipating).toBe(true)
    expect(weekly.participants).toBe(458)
    expect(wrapper.vm.myCompetitions).toHaveLength(1)
    expect(wrapper.vm.myCompetitions.some((item) => item.title === 'Trading Semanal')).toBe(false)
    expect(window.alert).toHaveBeenCalledTimes(2)
  })

  it('adjustCopy só alerta e não muda o capital alocado da estratégia', () => {
    const growth = wrapper.vm.copiedStrategies.find((item) => item.name === 'Growth Tech Strategy')
    const copiedBefore = wrapper.vm.copiedStrategies.map((item) => item.amount)
    const totalBefore = wrapper.vm.socialPortfolio.totalCopied

    wrapper.vm.adjustCopy(growth)

    expect(window.alert).toHaveBeenCalledWith(
      'Ajustando configurações de cópia para Growth Tech Strategy'
    )
    expect(growth.amount).toBe(2500)
    expect(wrapper.vm.copiedStrategies.map((item) => item.amount)).toEqual(copiedBefore)
    expect(wrapper.vm.socialPortfolio.totalCopied).toBe(totalBefore)
    expect(wrapper.vm.copiedStrategies).toHaveLength(2)
  })
})
