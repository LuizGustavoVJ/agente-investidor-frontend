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

describe('CollaborativeFeatures — Ler/abrir tópico/grupo/competição só alerta', () => {
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

  it('openTopic só alerta — replies, views e a lista de tópicos ficam iguais', () => {
    const topic = wrapper.vm.filteredTopics[0]
    const repliesBefore = topic.replies
    const viewsBefore = topic.views
    const titlesBefore = wrapper.vm.filteredTopics.map((item) => item.title)

    wrapper.vm.openTopic(topic)

    expect(window.alert).toHaveBeenCalledWith(`Abrindo tópico: ${topic.title}`)
    expect(topic.replies).toBe(repliesBefore)
    expect(topic.views).toBe(viewsBefore)
    expect(wrapper.vm.filteredTopics.map((item) => item.title)).toEqual(titlesBefore)
    expect(typeof wrapper.vm.router).toBe('undefined')
  })

  it('readKnowledge só alerta — views e likes do artigo não mudam', () => {
    const article = wrapper.vm.filteredKnowledge[0]
    const viewsBefore = article.views
    const likesBefore = article.likes

    wrapper.vm.readKnowledge(article)

    expect(window.alert).toHaveBeenCalledWith(`Lendo: ${article.title}`)
    expect(article.views).toBe(viewsBefore)
    expect(article.likes).toBe(likesBefore)
    expect(article.isSaved).toBe(false)
  })

  it('previewGroup só alerta — recommendedGroups e membros ficam iguais', () => {
    const group = wrapper.vm.recommendedGroups[0]
    const membersBefore = group.members
    const namesBefore = wrapper.vm.recommendedGroups.map((item) => item.name)

    wrapper.vm.previewGroup(group)

    expect(window.alert).toHaveBeenCalledWith(`Visualizando grupo: ${group.name}`)
    expect(group.members).toBe(membersBefore)
    expect(wrapper.vm.recommendedGroups.map((item) => item.name)).toEqual(namesBefore)
    expect(wrapper.vm.myGroups.some((item) => item.name === group.name)).toBe(false)
  })

  it('viewCompetition e shareCompetition só alertam — ranking e retorno não mudam', () => {
    const competition = wrapper.vm.myCompetitions[0]
    const returnBefore = competition.myReturn
    const participantsBefore = competition.totalParticipants

    wrapper.vm.viewCompetition(competition)
    wrapper.vm.shareCompetition(competition)

    expect(window.alert).toHaveBeenCalledWith(
      `Visualizando sua performance na competição: ${competition.title}`
    )
    expect(window.alert).toHaveBeenCalledWith(`Compartilhando competição: ${competition.title}`)
    expect(competition.myReturn).toBe(returnBefore)
    expect(competition.totalParticipants).toBe(participantsBefore)
    expect(wrapper.vm.myCompetitions).toHaveLength(1)
  })
})
