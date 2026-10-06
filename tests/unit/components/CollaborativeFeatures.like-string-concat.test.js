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

describe('CollaborativeFeatures — like com likes string e contrato de percentual', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CollaborativeFeatures)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('likeKnowledge concatena se likes vier como string de API', () => {
    const item = { id: 77, likes: '10', isLiked: false }

    wrapper.vm.likeKnowledge(item)

    expect(item.isLiked).toBe(true)
    expect(item.likes).toBe('101')
    expect(item.likes).not.toBe(11)
  })

  it('unlike com likes string concatena o -1 em vez de decrementar', () => {
    const item = { id: 78, likes: '10', isLiked: true }

    wrapper.vm.likeKnowledge(item)

    expect(item.isLiked).toBe(false)
    expect(item.likes).toBe('10-1')
    expect(item.likes).not.toBe(9)
  })

  it('formatPercentage trata o valor como razão 0–1; percentual estilo Dashboard vira 847%', () => {
    expect(wrapper.vm.formatPercentage(0.0847)).toBe('8.47%')
    expect(wrapper.vm.formatPercentage(8.47)).toBe('847.00%')
    expect(wrapper.vm.formatPercentage(undefined)).toBe('NaN%')
  })
})
