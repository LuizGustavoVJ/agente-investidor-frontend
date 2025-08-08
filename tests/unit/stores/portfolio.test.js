import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioStore } from '@/stores/portfolio'

describe('Portfolio Store', () => {
  let portfolioStore

  beforeEach(() => {
    setActivePinia(createPinia())
    portfolioStore = usePortfolioStore()
    vi.clearAllMocks()
  })

  describe('Estado inicial', () => {
    it('deve ter estado inicial correto', () => {
      expect(portfolioStore.portfolio).toEqual({})
      expect(portfolioStore.assets).toEqual([])
      expect(portfolioStore.performance).toEqual({})
      expect(portfolioStore.diversification).toEqual({})
      expect(portfolioStore.isLoading).toBe(false)
      expect(portfolioStore.error).toBeNull()
    })
  })

  describe('Propriedades básicas', () => {
    it('deve ter propriedades necessárias', () => {
      expect(portfolioStore).toHaveProperty('portfolio')
      expect(portfolioStore).toHaveProperty('assets')
      expect(portfolioStore).toHaveProperty('performance')
      expect(portfolioStore).toHaveProperty('diversification')
      expect(portfolioStore).toHaveProperty('isLoading')
      expect(portfolioStore).toHaveProperty('error')
    })

    it('deve ter métodos necessários', () => {
      expect(typeof portfolioStore.clearError).toBe('function')
    })
  })

  describe('Gerenciamento de dados', () => {
    it('deve permitir definir portfolio', () => {
      const mockPortfolio = {
        id: 1,
        totalValue: 100000,
        totalInvested: 80000
      }

      portfolioStore.portfolio = mockPortfolio
      expect(portfolioStore.portfolio).toEqual(mockPortfolio)
    })

    it('deve permitir definir assets', () => {
      const mockAssets = [
        { id: 1, symbol: 'PETR4', quantity: 100 },
        { id: 2, symbol: 'VALE3', quantity: 50 }
      ]

      portfolioStore.assets = mockAssets
      expect(portfolioStore.assets).toEqual(mockAssets)
      expect(portfolioStore.assets).toHaveLength(2)
    })

    it('deve permitir definir performance', () => {
      const mockPerformance = {
        daily: { value: 500, percentage: 2.5 },
        monthly: { value: 2000, percentage: 8.0 }
      }

      portfolioStore.performance = mockPerformance
      expect(portfolioStore.performance).toEqual(mockPerformance)
    })

    it('deve permitir definir diversification', () => {
      const mockDiversification = {
        sectors: [
          { name: 'Financeiro', percentage: 40 },
          { name: 'Petróleo', percentage: 35 }
        ]
      }

      portfolioStore.diversification = mockDiversification
      expect(portfolioStore.diversification).toEqual(mockDiversification)
    })
  })

  describe('Gerenciamento de erro', () => {
    it('deve limpar erro', () => {
      portfolioStore.error = 'Algum erro'
      
      portfolioStore.clearError()
      
      expect(portfolioStore.error).toBeNull()
    })
  })

  describe('Estado de loading', () => {
    it('deve gerenciar estado de loading', () => {
      portfolioStore.isLoading = true
      expect(portfolioStore.isLoading).toBe(true)
      
      portfolioStore.isLoading = false
      expect(portfolioStore.isLoading).toBe(false)
    })
  })

  describe('Manipulação de assets', () => {
    it('deve adicionar asset à lista', () => {
      const newAsset = { id: 1, symbol: 'PETR4', quantity: 100 }
      
      portfolioStore.assets.push(newAsset)
      
      expect(portfolioStore.assets).toContain(newAsset)
      expect(portfolioStore.assets).toHaveLength(1)
    })

    it('deve remover asset da lista', () => {
      const asset1 = { id: 1, symbol: 'PETR4' }
      const asset2 = { id: 2, symbol: 'VALE3' }
      
      portfolioStore.assets = [asset1, asset2]
      
      // Remover primeiro asset
      portfolioStore.assets = portfolioStore.assets.filter(a => a.id !== 1)
      
      expect(portfolioStore.assets).toEqual([asset2])
      expect(portfolioStore.assets).toHaveLength(1)
    })
  })
})

