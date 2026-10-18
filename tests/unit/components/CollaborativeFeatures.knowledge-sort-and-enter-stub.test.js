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

describe('CollaborativeFeatures — sort de conhecimento muta a fonte e Entrar no grupo é stub', () => {
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

  it('ordenar por popular muta o array canônico (filter all reusa a mesma referência)', async () => {
    expect(wrapper.vm.knowledgeFilter).toBe('all')
    expect(wrapper.vm.knowledgeSort).toBe('recent')

    const source = wrapper.vm.filteredKnowledge
    expect(source.map((item) => item.id)).toEqual([1, 2])
    expect(source[0].title).toContain('Setor Bancário')

    wrapper.vm.knowledgeSort = 'popular'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.filteredKnowledge).toBe(source)
    expect(source.map((item) => item.id)).toEqual([2, 1])
    expect(source[0].title).toContain('Valor Intrínseco')
    expect(source[0].likes).toBe(1247)
  })

  it('filtro saved não existe — saveKnowledge só liga a flag', async () => {
    wrapper.vm.activeTab = 'knowledge'
    await wrapper.vm.$nextTick()

    const filterSelect = wrapper.findAll('.filter-select')[0]
    const options = [...filterSelect.findAll('option')].map((option) => option.element.value)
    expect(options).toEqual(['all', 'analysis', 'tutorial', 'insight', 'strategy'])
    expect(options).not.toContain('saved')

    const first = wrapper.vm.filteredKnowledge[0]
    expect(first.isSaved).toBe(false)

    wrapper.vm.saveKnowledge(first)

    expect(first.isSaved).toBe(true)
    expect(wrapper.vm.filteredKnowledge.filter((item) => item.isSaved)).toHaveLength(2)
    expect(wrapper.vm.knowledgeFilter).toBe('all')
  })

  it('enterGroup só alerta — myGroups, membros e posts ficam iguais', () => {
    const valueGroup = wrapper.vm.myGroups.find((group) => group.name === 'Value Investors Brasil')
    const namesBefore = wrapper.vm.myGroups.map((group) => group.name)
    const membersBefore = valueGroup.members
    const postsBefore = valueGroup.posts

    wrapper.vm.enterGroup(valueGroup)

    expect(window.alert).toHaveBeenCalledWith('Entrando no grupo: Value Investors Brasil')
    expect(wrapper.vm.myGroups.map((group) => group.name)).toEqual(namesBefore)
    expect(valueGroup.members).toBe(membersBefore)
    expect(valueGroup.posts).toBe(postsBefore)
    expect(wrapper.vm.activeTab).toBe('social-trading')
  })
})
