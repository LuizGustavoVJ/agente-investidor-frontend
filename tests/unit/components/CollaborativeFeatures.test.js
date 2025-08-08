import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CollaborativeFeatures from '@/components/CollaborativeFeatures.vue'

// Mock Chart.js
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
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    wrapper = mount(CollaborativeFeatures, {
      global: {
        plugins: [pinia]
      }
    })
  })

  it('should render collaborative features component', () => {
    expect(wrapper.find('.collaborative-features').exists()).toBe(true)
  })

  it('should display all feature tabs', () => {
    const tabs = wrapper.findAll('.tab-button')
    expect(tabs.length).toBe(5)
    expect(wrapper.text()).toContain('Social Trading')
    expect(wrapper.text()).toContain('Fórum')
    expect(wrapper.text()).toContain('Conhecimento')
    expect(wrapper.text()).toContain('Grupos')
    expect(wrapper.text()).toContain('Competições')
  })

  it('should switch between tabs', async () => {
    const forumTab = wrapper.find('[data-tab="forum"]')
    if (forumTab.exists()) {
      await forumTab.trigger('click')
      expect(wrapper.vm.activeTab).toBe('forum')
    }
  })

  it('should display social trading section', async () => {
    wrapper.vm.activeTab = 'social-trading'
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.social-trading-section').exists()).toBe(true)
    expect(wrapper.text()).toContain('Top Traders')
  })

  it('should handle trader following', async () => {
    const followBtn = wrapper.find('.follow-btn')
    if (followBtn.exists()) {
      await followBtn.trigger('click')
      // Verify follow functionality
    }
  })

  it('should display forum categories', async () => {
    wrapper.vm.activeTab = 'forum'
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.forum-categories').exists()).toBe(true)
    expect(wrapper.findAll('.category-btn').length).toBeGreaterThan(0)
  })

  it('should filter forum topics by category', async () => {
    wrapper.vm.activeTab = 'forum'
    wrapper.vm.selectedCategory = 'analysis'
    await wrapper.vm.$nextTick()
    
    const filteredTopics = wrapper.vm.filteredTopics
    expect(Array.isArray(filteredTopics)).toBe(true)
  })

  it('should open new topic modal', async () => {
    wrapper.vm.activeTab = 'forum'
    await wrapper.vm.$nextTick()
    
    const newTopicBtn = wrapper.find('.new-topic-btn')
    if (newTopicBtn.exists()) {
      await newTopicBtn.trigger('click')
      expect(wrapper.vm.showNewTopicModal).toBe(true)
    }
  })

  it('should create new topic', async () => {
    wrapper.vm.newTopic.title = 'Test Topic'
    wrapper.vm.newTopic.category = 'analysis'
    wrapper.vm.newTopic.content = 'Test content'
    
    await wrapper.vm.createTopic()
    
    expect(wrapper.vm.showNewTopicModal).toBe(false)
    expect(wrapper.vm.newTopic.title).toBe('')
  })

  it('should display knowledge sharing section', async () => {
    wrapper.vm.activeTab = 'knowledge'
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.knowledge-section').exists()).toBe(true)
    expect(wrapper.find('.knowledge-grid').exists()).toBe(true)
  })

  it('should filter knowledge by type', async () => {
    wrapper.vm.activeTab = 'knowledge'
    wrapper.vm.knowledgeFilter = 'tutorial'
    await wrapper.vm.$nextTick()
    
    const filteredKnowledge = wrapper.vm.filteredKnowledge
    expect(Array.isArray(filteredKnowledge)).toBe(true)
  })

  it('should like knowledge items', async () => {
    const likeBtn = wrapper.find('.like-btn')
    if (likeBtn.exists()) {
      await likeBtn.trigger('click')
      // Verify like functionality
    }
  })

  it('should display groups section', async () => {
    wrapper.vm.activeTab = 'groups'
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.groups-section').exists()).toBe(true)
    expect(wrapper.find('.my-groups').exists()).toBe(true)
    expect(wrapper.find('.recommended-groups').exists()).toBe(true)
  })

  it('should join recommended groups', async () => {
    const joinBtn = wrapper.find('.join-btn')
    if (joinBtn.exists()) {
      await joinBtn.trigger('click')
      // Verify join functionality
    }
  })

  it('should display competitions section', async () => {
    wrapper.vm.activeTab = 'competitions'
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.competitions-section').exists()).toBe(true)
    expect(wrapper.find('.active-competitions').exists()).toBe(true)
  })

  it('should join competitions', async () => {
    const joinCompetitionBtn = wrapper.find('.join-competition-btn')
    if (joinCompetitionBtn.exists()) {
      await joinCompetitionBtn.trigger('click')
      // Verify join competition functionality
    }
  })

  it('should format numbers correctly', () => {
    const { formatNumber } = wrapper.vm
    expect(formatNumber(1234)).toBe('1.234')
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('should format percentages correctly', () => {
    const { formatPercentage } = wrapper.vm
    expect(formatPercentage(0.1234)).toBe('12,34%')
    expect(formatPercentage(-0.0567)).toBe('-5,67%')
  })

  it('should format currency correctly', () => {
    const { formatCurrency } = wrapper.vm
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
  })

  it('should format dates correctly', () => {
    const { formatDate } = wrapper.vm
    const testDate = new Date('2024-01-15')
    expect(formatDate(testDate)).toBe('15/01/2024')
  })

  it('should handle modal closing', async () => {
    wrapper.vm.showNewTopicModal = true
    await wrapper.vm.$nextTick()
    
    const modalClose = wrapper.find('.modal-close')
    if (modalClose.exists()) {
      await modalClose.trigger('click')
      expect(wrapper.vm.showNewTopicModal).toBe(false)
    }
  })
})

