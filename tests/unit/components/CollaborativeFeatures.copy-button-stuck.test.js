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

describe('CollaborativeFeatures — botão Copiar fica preso após copyTrader', () => {
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

  it('copyTrader desabilita o botão e stopCopy não reabilita porque o trader não entra na lista', async () => {
    const roberto = wrapper.vm.topTraders.find((trader) => trader.name === 'Roberto Lima')
    const copyButtons = () => wrapper.findAll('.copy-btn')
    const buttonFor = (name) => {
      const card = wrapper.findAll('.trader-card').find((card) => card.text().includes(name))
      return card?.find('.copy-btn')
    }

    expect(roberto.isFollowing).toBe(false)
    expect(roberto.isCopying).toBe(false)
    expect(buttonFor('Roberto Lima')?.attributes('disabled')).toBeUndefined()
    expect(buttonFor('Roberto Lima')?.text()).toContain('Copiar Estratégia')
    expect(wrapper.vm.copiedStrategies.some((item) => item.traderName === 'Roberto Lima')).toBe(false)

    wrapper.vm.copyTrader(roberto)
    await wrapper.vm.$nextTick()

    expect(roberto.isFollowing).toBe(true)
    expect(roberto.isCopying).toBe(true)
    expect(buttonFor('Roberto Lima')?.attributes('disabled')).toBeDefined()
    expect(buttonFor('Roberto Lima')?.text()).toContain('Copiando')
    expect(wrapper.vm.copiedStrategies.some((item) => item.traderName === 'Roberto Lima')).toBe(false)
    expect(copyButtons().filter((btn) => btn.attributes('disabled') !== undefined).length).toBeGreaterThanOrEqual(2)

    const growth = wrapper.vm.copiedStrategies.find((item) => item.name === 'Growth Tech Strategy')
    wrapper.vm.stopCopy(growth)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.copiedStrategies.some((item) => item.name === 'Growth Tech Strategy')).toBe(false)
    expect(roberto.isCopying).toBe(true)
    expect(roberto.isFollowing).toBe(true)
    expect(buttonFor('Roberto Lima')?.attributes('disabled')).toBeDefined()
    expect(buttonFor('Roberto Lima')?.text()).toContain('Copiando')
  })

  it('Ana já copiando nasce com o botão desabilitado e stopCopy da lista não zera isCopying', async () => {
    const ana = wrapper.vm.topTraders.find((trader) => trader.name === 'Ana Costa')
    const card = wrapper.findAll('.trader-card').find((item) => item.text().includes('Ana Costa'))
    const copyBtn = card.find('.copy-btn')

    expect(ana.isFollowing).toBe(true)
    expect(ana.isCopying).toBe(true)
    expect(copyBtn.attributes('disabled')).toBeDefined()
    expect(copyBtn.text()).toContain('Copiando')

    const growth = wrapper.vm.copiedStrategies.find((item) => item.name === 'Growth Tech Strategy')
    wrapper.vm.stopCopy(growth)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.copiedStrategies.some((item) => item.name === 'Growth Tech Strategy')).toBe(false)
    expect(ana.isCopying).toBe(true)
    expect(copyBtn.attributes('disabled')).toBeDefined()
    expect(copyBtn.text()).toContain('Copiando')
  })
})
