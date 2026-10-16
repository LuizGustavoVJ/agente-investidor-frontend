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

describe('CollaborativeFeatures — joinGroup e leaveGroup não sincronizam membros nem listas', () => {
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

  it('joinGroup público só alerta — não entra em myGroups nem incrementa membros', () => {
    const dividendos = wrapper.vm.recommendedGroups.find((group) => group.name === 'Dividendos e FIIs')
    const mineBefore = wrapper.vm.myGroups.map((group) => group.name)

    expect(dividendos.isPrivate).toBe(false)
    expect(dividendos.members).toBe(5234)
    expect(mineBefore).toEqual(['Value Investors Brasil', 'Tech Stocks BR'])
    expect(wrapper.vm.recommendedGroups).toHaveLength(2)

    wrapper.vm.joinGroup(dividendos)

    expect(window.alert).toHaveBeenCalledWith('Entrando no grupo: Dividendos e FIIs')
    expect(wrapper.vm.myGroups).toHaveLength(2)
    expect(wrapper.vm.myGroups.map((group) => group.name)).toEqual(mineBefore)
    expect(wrapper.vm.myGroups.some((group) => group.name === 'Dividendos e FIIs')).toBe(false)
    expect(dividendos.members).toBe(5234)
    expect(wrapper.vm.recommendedGroups.some((group) => group.name === 'Dividendos e FIIs')).toBe(true)
    expect(wrapper.vm.recommendedGroups).toHaveLength(2)
  })

  it('joinGroup privado solicita entrada e também não altera membros nem myGroups', () => {
    const tecnica = wrapper.vm.recommendedGroups.find((group) => group.name === 'Análise Técnica Avançada')

    expect(tecnica.isPrivate).toBe(true)
    expect(tecnica.members).toBe(892)

    wrapper.vm.joinGroup(tecnica)

    expect(window.alert).toHaveBeenCalledWith('Solicitando entrada no grupo: Análise Técnica Avançada')
    expect(wrapper.vm.myGroups.some((group) => group.name === 'Análise Técnica Avançada')).toBe(false)
    expect(tecnica.members).toBe(892)
    expect(wrapper.vm.recommendedGroups.some((group) => group.id === 4)).toBe(true)
  })

  it('leaveGroup remove de myGroups e não devolve o grupo a recommendedGroups', () => {
    const tech = wrapper.vm.myGroups.find((group) => group.name === 'Tech Stocks BR')
    const recommendedBefore = wrapper.vm.recommendedGroups.map((group) => group.name)

    expect(tech.members).toBe(1523)
    expect(wrapper.vm.myGroups).toHaveLength(2)
    expect(recommendedBefore).toEqual(['Dividendos e FIIs', 'Análise Técnica Avançada'])

    wrapper.vm.leaveGroup(tech)

    expect(window.confirm).toHaveBeenCalledWith('Deseja sair do grupo Tech Stocks BR?')
    expect(wrapper.vm.myGroups).toHaveLength(1)
    expect(wrapper.vm.myGroups.map((group) => group.name)).toEqual(['Value Investors Brasil'])
    expect(wrapper.vm.recommendedGroups.map((group) => group.name)).toEqual(recommendedBefore)
    expect(wrapper.vm.recommendedGroups.some((group) => group.name === 'Tech Stocks BR')).toBe(false)
    expect(tech.members).toBe(1523)
  })

  it('leaveGroup com confirm cancelado não altera as listas', () => {
    window.confirm.mockReturnValueOnce(false)
    const value = wrapper.vm.myGroups.find((group) => group.name === 'Value Investors Brasil')

    wrapper.vm.leaveGroup(value)

    expect(wrapper.vm.myGroups).toHaveLength(2)
    expect(wrapper.vm.myGroups.some((group) => group.name === 'Value Investors Brasil')).toBe(true)
    expect(wrapper.vm.recommendedGroups).toHaveLength(2)
  })
})
