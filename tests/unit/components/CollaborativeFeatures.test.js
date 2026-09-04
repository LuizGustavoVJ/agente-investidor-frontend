import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CollaborativeFeatures from '@/components/CollaborativeFeatures.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    data: { datasets: [] },
    options: {}
  }))
}))

describe('CollaborativeFeatures', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    wrapper = mount(CollaborativeFeatures, {
      global: {
        plugins: [createPinia()]
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
    vi.restoreAllMocks()
  })

  const traderByName = (name) => wrapper.vm.topTraders.find((t) => t.name === name)

  describe('Social trading', () => {
    it('alterna follow e interrompe a cópia ao deixar de seguir', () => {
      const trader = traderByName('Ana Costa')
      expect(trader.isFollowing).toBe(true)
      expect(trader.isCopying).toBe(true)

      wrapper.vm.followTrader(trader)

      expect(trader.isFollowing).toBe(false)
      expect(trader.isCopying).toBe(false)
    })

    it('ao copiar um trader não seguido, passa a seguir e marca isCopying', () => {
      const trader = traderByName('Carlos Silva')
      expect(trader.isFollowing).toBe(false)
      expect(trader.isCopying).toBe(false)

      wrapper.vm.copyTrader(trader)

      expect(trader.isFollowing).toBe(true)
      expect(trader.isCopying).toBe(true)
    })

    it('remove estratégia copiada só quando o usuário confirma', () => {
      const strategy = wrapper.vm.copiedStrategies[0]
      const initialCount = wrapper.vm.copiedStrategies.length

      window.confirm.mockReturnValueOnce(false)
      wrapper.vm.stopCopy(strategy)
      expect(wrapper.vm.copiedStrategies).toHaveLength(initialCount)

      window.confirm.mockReturnValueOnce(true)
      wrapper.vm.stopCopy(strategy)
      expect(wrapper.vm.copiedStrategies).toHaveLength(initialCount - 1)
      expect(wrapper.vm.copiedStrategies.find((s) => s.id === strategy.id)).toBeUndefined()
    })
  })

  describe('Fórum', () => {
    it('filtra tópicos por categoria e devolve todos quando a categoria é all', () => {
      wrapper.vm.selectedCategory = 'all'
      const allCount = wrapper.vm.filteredTopics.length
      expect(allCount).toBeGreaterThan(1)

      wrapper.vm.selectedCategory = 'analysis'
      expect(wrapper.vm.filteredTopics.every((t) => t.category === 'analysis')).toBe(true)
      expect(wrapper.vm.filteredTopics.length).toBeGreaterThan(0)
      expect(wrapper.vm.filteredTopics.length).toBeLessThan(allCount)
    })

    it('cria tópico no topo da lista, parseia tags e reseta o formulário', () => {
      wrapper.vm.selectedCategory = 'all'
      wrapper.vm.newTopic.title = 'Vale a pena FIIs agora?'
      wrapper.vm.newTopic.category = 'strategies'
      wrapper.vm.newTopic.content = 'Conteúdo completo do tópico para extrair o excerpt.'
      wrapper.vm.newTopic.tags = ' FII , dividendos , 2026 '
      wrapper.vm.showNewTopicModal = true

      wrapper.vm.createTopic()

      const created = wrapper.vm.filteredTopics[0]
      expect(created.title).toBe('Vale a pena FIIs agora?')
      expect(created.author).toBe('Você')
      expect(created.tags).toEqual(['FII', 'dividendos', '2026'])
      expect(created.excerpt.endsWith('...')).toBe(true)
      expect(wrapper.vm.showNewTopicModal).toBe(false)
      expect(wrapper.vm.newTopic.title).toBe('')
      expect(wrapper.vm.newTopic.content).toBe('')
    })

    it('devolve nome da categoria conhecida e string vazia para id desconhecido', () => {
      expect(wrapper.vm.getCategoryName('analysis')).toBe('Análises')
      expect(wrapper.vm.getCategoryName('nao-existe')).toBe('')
    })
  })

  describe('Conhecimento', () => {
    it('filtra por tipo e ordena por popularidade (likes)', () => {
      wrapper.vm.knowledgeFilter = 'tutorial'
      expect(wrapper.vm.filteredKnowledge.every((item) => item.type === 'tutorial')).toBe(true)

      wrapper.vm.knowledgeFilter = 'all'
      wrapper.vm.knowledgeSort = 'popular'
      const likes = wrapper.vm.filteredKnowledge.map((item) => item.likes)
      const sorted = [...likes].sort((a, b) => b - a)
      expect(likes).toEqual(sorted)
    })

    it('incrementa likes ao curtir e decrementa ao descurtir', () => {
      const item = { isLiked: false, likes: 10 }

      wrapper.vm.likeKnowledge(item)
      expect(item.isLiked).toBe(true)
      expect(item.likes).toBe(11)

      wrapper.vm.likeKnowledge(item)
      expect(item.isLiked).toBe(false)
      expect(item.likes).toBe(10)
    })

    it('alterna o estado de salvo', () => {
      const item = { isSaved: false }
      wrapper.vm.saveKnowledge(item)
      expect(item.isSaved).toBe(true)
      wrapper.vm.saveKnowledge(item)
      expect(item.isSaved).toBe(false)
    })

    it('usa label conhecida ou o próprio tipo como fallback', () => {
      expect(wrapper.vm.getTypeLabel('tutorial')).toBe('Tutorial')
      expect(wrapper.vm.getTypeLabel('custom')).toBe('custom')
    })
  })

  describe('Grupos e competições', () => {
    it('remove o grupo da lista somente após confirmação', () => {
      const group = wrapper.vm.myGroups[0]
      const initialCount = wrapper.vm.myGroups.length

      window.confirm.mockReturnValueOnce(false)
      wrapper.vm.leaveGroup(group)
      expect(wrapper.vm.myGroups).toHaveLength(initialCount)

      window.confirm.mockReturnValueOnce(true)
      wrapper.vm.leaveGroup(group)
      expect(wrapper.vm.myGroups.find((g) => g.id === group.id)).toBeUndefined()
    })

    it('inscreve na competição e incrementa participantes', () => {
      const competition = wrapper.vm.activeCompetitions.find((c) => !c.isParticipating)
      const participants = competition.participants

      wrapper.vm.joinCompetition(competition)

      expect(competition.isParticipating).toBe(true)
      expect(competition.participants).toBe(participants + 1)
    })

    it('traduz status de competição e faz fallback para o valor original', () => {
      expect(wrapper.vm.getCompetitionStatusLabel('active')).toBe('Ativa')
      expect(wrapper.vm.getCompetitionStatusLabel('registration')).toBe('Inscrições Abertas')
      expect(wrapper.vm.getCompetitionStatusLabel('draft')).toBe('draft')
    })
  })

  describe('Formatação', () => {
    it('formata percentual multiplicando por 100 com duas casas', () => {
      expect(wrapper.vm.formatPercentage(0.1234)).toBe('12.34%')
      expect(wrapper.vm.formatPercentage(-0.0567)).toBe('-5.67%')
    })

    it('formata tempo relativo em minutos, horas e dias', () => {
      vi.useFakeTimers()
      const now = new Date('2026-09-04T12:00:00.000Z')
      vi.setSystemTime(now)

      expect(wrapper.vm.formatTime(new Date(now.getTime() - 30 * 60 * 1000))).toBe('30m atrás')
      expect(wrapper.vm.formatTime(new Date(now.getTime() - 2 * 60 * 60 * 1000))).toBe('2h atrás')
      expect(wrapper.vm.formatTime(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000))).toBe('3d atrás')

      vi.useRealTimers()
    })
  })
})
