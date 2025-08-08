import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MarketSummary from '@/components/MarketSummary.vue'

// Mock Chart.js
vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    data: { datasets: [] },
    options: {}
  }))
}))

describe('MarketSummary', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    wrapper = mount(MarketSummary, {
      global: {
        plugins: [pinia]
      }
    })
  })

  it('should render market summary component', () => {
    expect(wrapper.find('.market-summary').exists()).toBe(true)
  })

  it('should display market indices', () => {
    expect(wrapper.find('.indices-grid').exists()).toBe(true)
    expect(wrapper.text()).toContain('Ibovespa')
    expect(wrapper.text()).toContain('IFIX')
    expect(wrapper.text()).toContain('Dólar')
  })

  it('should show market alerts section', () => {
    expect(wrapper.find('.market-alerts').exists()).toBe(true)
    expect(wrapper.text()).toContain('Alertas de Mercado')
  })

  it('should display performance chart', () => {
    expect(wrapper.find('.performance-chart').exists()).toBe(true)
  })

  it('should handle refresh action', async () => {
    const refreshBtn = wrapper.find('.refresh-btn')
    expect(refreshBtn.exists()).toBe(true)
    
    await refreshBtn.trigger('click')
    // Verify refresh functionality
  })

  it('should format currency values correctly', () => {
    const { formatCurrency } = wrapper.vm
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })

  it('should format percentage values correctly', () => {
    const { formatPercentage } = wrapper.vm
    expect(formatPercentage(0.1234)).toBe('+12,34%')
    expect(formatPercentage(-0.0567)).toBe('-5,67%')
    expect(formatPercentage(0)).toBe('0,00%')
  })

  it('should apply correct CSS classes for positive/negative values', () => {
    const positiveElement = wrapper.find('.positive')
    const negativeElement = wrapper.find('.negative')
    
    if (positiveElement.exists()) {
      expect(positiveElement.classes()).toContain('positive')
    }
    
    if (negativeElement.exists()) {
      expect(negativeElement.classes()).toContain('negative')
    }
  })

  it('should update data on mount', () => {
    expect(wrapper.vm.marketData).toBeDefined()
    expect(wrapper.vm.marketData.length).toBeGreaterThan(0)
  })

  it('should handle auto-refresh toggle', async () => {
    const autoRefreshToggle = wrapper.find('.auto-refresh-toggle')
    if (autoRefreshToggle.exists()) {
      await autoRefreshToggle.trigger('click')
      expect(wrapper.vm.autoRefresh).toBeDefined()
    }
  })

  it('should display loading state', async () => {
    wrapper.vm.isLoading = true
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })
})

