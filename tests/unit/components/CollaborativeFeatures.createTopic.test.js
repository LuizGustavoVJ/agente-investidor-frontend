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

describe('CollaborativeFeatures — createTopic, tags e likes', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CollaborativeFeatures)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('sempre concatena "..." no excerpt, mesmo com conteúdo curto', () => {
    wrapper.vm.newTopic.title = 'Dúvida rápida'
    wrapper.vm.newTopic.category = 'analysis'
    wrapper.vm.newTopic.content = 'Oi'
    wrapper.vm.newTopic.tags = 'petr4'

    wrapper.vm.createTopic()

    const created = wrapper.vm.filteredTopics[0]
    expect(created.excerpt).toBe('Oi...')
    expect(created.excerpt).not.toBe('Oi')
    expect(created.tags).toEqual(['petr4'])
  })

  it('lança TypeError se content estiver ausente', () => {
    wrapper.vm.newTopic.title = 'Sem corpo'
    wrapper.vm.newTopic.category = 'analysis'
    wrapper.vm.newTopic.content = undefined
    wrapper.vm.newTopic.tags = 'ok'

    expect(() => wrapper.vm.createTopic()).toThrow(TypeError)
  })

  it('lança TypeError se tags estiver ausente (split)', () => {
    wrapper.vm.newTopic.title = 'Sem tags'
    wrapper.vm.newTopic.category = 'analysis'
    wrapper.vm.newTopic.content = 'conteúdo válido'
    wrapper.vm.newTopic.tags = undefined

    expect(() => wrapper.vm.createTopic()).toThrow(TypeError)
  })

  it('tags vazias viram um item em branco em vez de lista vazia', () => {
    wrapper.vm.newTopic.title = 'Sem hashtags'
    wrapper.vm.newTopic.category = 'analysis'
    wrapper.vm.newTopic.content = 'texto'
    wrapper.vm.newTopic.tags = ''

    wrapper.vm.createTopic()

    expect(wrapper.vm.filteredTopics[0].tags).toEqual([''])
  })

  it('likeKnowledge com likes undefined produz NaN', () => {
    const item = wrapper.vm.filteredKnowledge[0]
    item.likes = undefined
    item.isLiked = false

    wrapper.vm.likeKnowledge(item)

    expect(item.isLiked).toBe(true)
    expect(item.likes).toBeNaN()
  })
})
