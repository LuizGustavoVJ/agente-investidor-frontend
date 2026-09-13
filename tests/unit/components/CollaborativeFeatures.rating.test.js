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

const starsFromTemplate = (rating) =>
  '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating))

describe('CollaborativeFeatures — rating e ordenação destrutiva', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CollaborativeFeatures)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('createArticle grava rating 0; o template quebra sem rating (toFixed) ou com rating > 5 (repeat)', async () => {
    wrapper.vm.newArticle.type = 'insight'
    wrapper.vm.newArticle.title = 'Sem avaliação'
    wrapper.vm.newArticle.description = 'Artigo novo'
    wrapper.vm.newArticle.content = 'corpo'
    wrapper.vm.newArticle.tags = ''
    wrapper.vm.createArticle()

    const created = wrapper.vm.filteredKnowledge[0]
    expect(created.rating).toBe(0)
    expect(starsFromTemplate(0)).toBe('☆☆☆☆☆')
    expect(created.rating.toFixed(1)).toBe('0.0')

    expect(() => created.rating.toFixed(1)).not.toThrow()
    expect(() => (undefined).toFixed(1)).toThrow(TypeError)
    expect(() => starsFromTemplate(6)).toThrow(RangeError)

    created.rating = undefined
    wrapper.vm.activeTab = 'knowledge'

    await expect(async () => {
      await wrapper.vm.$nextTick()
      wrapper.html()
    }).rejects.toThrow()
  })

  it('ordenar por rating muta o array original de conhecimento', () => {
    const list = wrapper.vm.filteredKnowledge
    const idsBefore = list.map((item) => item.id)

    wrapper.vm.knowledgeSort = 'rating'
    const afterRating = wrapper.vm.filteredKnowledge

    expect(afterRating).toBe(list)
    expect(afterRating.map((item) => item.id)).not.toEqual(idsBefore)
    expect(afterRating[0].rating).toBeGreaterThanOrEqual(afterRating.at(-1).rating)
  })
})
