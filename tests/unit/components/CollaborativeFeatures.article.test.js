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

describe('CollaborativeFeatures — artigo, ordenação e grupos', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CollaborativeFeatures)
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    window.alert.mockRestore?.()
    wrapper.unmount()
  })

  it('createArticle coloca o item no topo, parseia tags e reseta o formulário', () => {
    const previousCount = wrapper.vm.filteredKnowledge.length
    wrapper.vm.newArticle.title = 'Leitura de balanço'
    wrapper.vm.newArticle.type = 'tutorial'
    wrapper.vm.newArticle.description = 'Passo a passo'
    wrapper.vm.newArticle.tags = 'PETR4,  vale3 '

    wrapper.vm.createArticle()

    expect(wrapper.vm.filteredKnowledge).toHaveLength(previousCount + 1)
    expect(wrapper.vm.filteredKnowledge[0]).toMatchObject({
      title: 'Leitura de balanço',
      type: 'tutorial',
      description: 'Passo a passo',
      tags: ['PETR4', 'vale3'],
      author: { name: 'Você' }
    })
    expect(wrapper.vm.showNewArticleModal).toBe(false)
    expect(wrapper.vm.newArticle.title).toBe('')
    expect(wrapper.vm.newArticle.tags).toBe('')
  })

  it('ordena conhecimento por views (trending) e por rating', () => {
    wrapper.vm.knowledgeSort = 'trending'
    const byViews = wrapper.vm.filteredKnowledge
    const views = byViews.map((item) => item.views)
    expect(views).toEqual([...views].sort((a, b) => b - a))

    wrapper.vm.knowledgeSort = 'rating'
    const byRating = wrapper.vm.filteredKnowledge
    const ratings = byRating.map((item) => item.rating)
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a))
  })

  it('joinGroup pede entrada em grupo privado e entra direto em grupo aberto', () => {
    const openGroup = wrapper.vm.recommendedGroups.find((group) => !group.isPrivate)
    const privateGroup = wrapper.vm.recommendedGroups.find((group) => group.isPrivate)

    wrapper.vm.joinGroup(openGroup)
    expect(window.alert).toHaveBeenCalledWith(`Entrando no grupo: ${openGroup.name}`)

    wrapper.vm.joinGroup(privateGroup)
    expect(window.alert).toHaveBeenCalledWith(
      `Solicitando entrada no grupo: ${privateGroup.name}`
    )
  })
})
