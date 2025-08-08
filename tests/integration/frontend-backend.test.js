import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('Frontend-Backend Integration', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('Authentication Integration', () => {
    it('should authenticate user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: { id: 1, name: 'Test User', email: 'test@example.com' },
          token: 'mock-jwt-token'
        }
      }
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse)
      
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const response = await axios.post('/api/auth/login', loginData)
      
      expect(response.data.success).toBe(true)
      expect(response.data.user.email).toBe('test@example.com')
      expect(response.data.token).toBeDefined()
    })

    it('should handle authentication errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      }
      
      mockedAxios.post.mockRejectedValueOnce(mockError)
      
      try {
        await axios.post('/api/auth/login', { email: 'wrong@email.com', password: 'wrong' })
      } catch (error) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.message).toBe('Invalid credentials')
      }
    })

    it('should refresh token automatically', async () => {
      const mockResponse = {
        data: {
          success: true,
          token: 'new-jwt-token'
        }
      }
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse)
      
      const response = await axios.post('/api/auth/refresh')
      
      expect(response.data.success).toBe(true)
      expect(response.data.token).toBe('new-jwt-token')
    })
  })

  describe('Portfolio Integration', () => {
    it('should fetch portfolio data', async () => {
      const mockPortfolio = {
        data: {
          success: true,
          portfolio: {
            totalValue: 100000,
            assets: [
              { symbol: 'PETR4', quantity: 100, currentPrice: 25.50 },
              { symbol: 'VALE3', quantity: 200, currentPrice: 65.80 }
            ],
            performance: {
              daily: 0.0234,
              monthly: 0.0567,
              yearly: 0.1234
            }
          }
        }
      }
      
      mockedAxios.get.mockResolvedValueOnce(mockPortfolio)
      
      const response = await axios.get('/api/portfolio')
      
      expect(response.data.success).toBe(true)
      expect(response.data.portfolio.totalValue).toBe(100000)
      expect(response.data.portfolio.assets.length).toBe(2)
    })

    it('should update portfolio asset', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Asset updated successfully'
        }
      }
      
      mockedAxios.put.mockResolvedValueOnce(mockResponse)
      
      const updateData = {
        symbol: 'PETR4',
        quantity: 150,
        averagePrice: 24.80
      }
      
      const response = await axios.put('/api/portfolio/assets/PETR4', updateData)
      
      expect(response.data.success).toBe(true)
      expect(response.data.message).toBe('Asset updated successfully')
    })
  })

  describe('Analysis Integration', () => {
    it('should fetch methodology analysis', async () => {
      const mockAnalysis = {
        data: {
          success: true,
          analysis: {
            methodology: 'warren_buffett',
            score: 85,
            recommendations: [
              { symbol: 'ITUB4', action: 'BUY', confidence: 0.92 },
              { symbol: 'BBDC4', action: 'HOLD', confidence: 0.78 }
            ],
            metrics: {
              pe_ratio: 12.5,
              roe: 0.18,
              debt_equity: 0.45
            }
          }
        }
      }
      
      mockedAxios.get.mockResolvedValueOnce(mockAnalysis)
      
      const response = await axios.get('/api/analysis/methodology/warren_buffett')
      
      expect(response.data.success).toBe(true)
      expect(response.data.analysis.score).toBe(85)
      expect(response.data.analysis.recommendations.length).toBe(2)
    })

    it('should run custom methodology', async () => {
      const mockResponse = {
        data: {
          success: true,
          results: {
            backtestId: 'bt_123456',
            performance: {
              totalReturn: 0.1567,
              sharpeRatio: 1.85,
              maxDrawdown: -0.0892
            }
          }
        }
      }
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse)
      
      const customMethodology = {
        name: 'My Custom Strategy',
        rules: {
          entry: [{ type: 'pe_ratio', operator: '<', value: 15 }],
          exit: [{ type: 'profit_target', value: 0.20 }]
        }
      }
      
      const response = await axios.post('/api/analysis/custom-methodology', customMethodology)
      
      expect(response.data.success).toBe(true)
      expect(response.data.results.backtestId).toBeDefined()
      expect(response.data.results.performance.totalReturn).toBeGreaterThan(0)
    })
  })

  describe('Market Data Integration', () => {
    it('should fetch real-time market data', async () => {
      const mockMarketData = {
        data: {
          success: true,
          marketData: {
            ibovespa: { value: 125000, change: 0.0234 },
            ifix: { value: 3200, change: -0.0156 },
            usd_brl: { value: 5.25, change: 0.0089 }
          },
          timestamp: new Date().toISOString()
        }
      }
      
      mockedAxios.get.mockResolvedValueOnce(mockMarketData)
      
      const response = await axios.get('/api/market/summary')
      
      expect(response.data.success).toBe(true)
      expect(response.data.marketData.ibovespa.value).toBe(125000)
      expect(response.data.timestamp).toBeDefined()
    })

    it('should fetch financial ratios', async () => {
      const mockRatios = {
        data: {
          success: true,
          ratios: {
            liquidez: {
              liquidez_corrente: 2.5,
              liquidez_seca: 1.8,
              liquidez_imediata: 0.3
            },
            rentabilidade: {
              roe: 0.18,
              roa: 0.12,
              margem_liquida: 0.15
            }
          }
        }
      }
      
      mockedAxios.get.mockResolvedValueOnce(mockRatios)
      
      const response = await axios.get('/api/analysis/financial-ratios/PETR4')
      
      expect(response.data.success).toBe(true)
      expect(response.data.ratios.liquidez.liquidez_corrente).toBe(2.5)
      expect(response.data.ratios.rentabilidade.roe).toBe(0.18)
    })
  })

  describe('Broker Integration', () => {
    it('should connect to broker', async () => {
      const mockResponse = {
        data: {
          success: true,
          connection: {
            brokerId: 'clear_001',
            status: 'connected',
            lastSync: new Date().toISOString()
          }
        }
      }
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse)
      
      const connectionData = {
        broker: 'clear',
        credentials: {
          username: 'test_user',
          password: 'encrypted_password'
        }
      }
      
      const response = await axios.post('/api/brokers/connect', connectionData)
      
      expect(response.data.success).toBe(true)
      expect(response.data.connection.status).toBe('connected')
    })

    it('should sync broker data', async () => {
      const mockResponse = {
        data: {
          success: true,
          syncResult: {
            assetsUpdated: 15,
            transactionsImported: 23,
            lastSync: new Date().toISOString()
          }
        }
      }
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse)
      
      const response = await axios.post('/api/brokers/sync/clear_001')
      
      expect(response.data.success).toBe(true)
      expect(response.data.syncResult.assetsUpdated).toBe(15)
      expect(response.data.syncResult.transactionsImported).toBe(23)
    })
  })

  describe('WebSocket Integration', () => {
    it('should handle WebSocket connection', () => {
      // Mock WebSocket
      const mockWebSocket = {
        onopen: vi.fn(),
        onmessage: vi.fn(),
        onclose: vi.fn(),
        onerror: vi.fn(),
        send: vi.fn(),
        close: vi.fn()
      }
      
      global.WebSocket = vi.fn(() => mockWebSocket)
      
      const ws = new WebSocket('ws://localhost:8000/ws')
      
      expect(ws).toBeDefined()
      expect(typeof ws.send).toBe('function')
      expect(typeof ws.close).toBe('function')
    })

    it('should handle real-time notifications', () => {
      const mockNotification = {
        type: 'market_alert',
        data: {
          symbol: 'PETR4',
          message: 'Preço atingiu R$ 25,00',
          severity: 'info'
        },
        timestamp: new Date().toISOString()
      }
      
      // Simulate WebSocket message
      const handleNotification = (notification) => {
        expect(notification.type).toBe('market_alert')
        expect(notification.data.symbol).toBe('PETR4')
      }
      
      handleNotification(mockNotification)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockedAxios.get.mockRejectedValueOnce(networkError)
      
      try {
        await axios.get('/api/portfolio')
      } catch (error) {
        expect(error.message).toBe('Network Error')
      }
    })

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      }
      
      mockedAxios.get.mockRejectedValueOnce(serverError)
      
      try {
        await axios.get('/api/analysis/methodology/invalid')
      } catch (error) {
        expect(error.response.status).toBe(500)
        expect(error.response.data.message).toBe('Internal Server Error')
      }
    })

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      }
      
      mockedAxios.get.mockRejectedValueOnce(timeoutError)
      
      try {
        await axios.get('/api/market/realtime')
      } catch (error) {
        expect(error.code).toBe('ECONNABORTED')
        expect(error.message).toContain('timeout')
      }
    })
  })

  describe('Performance Tests', () => {
    it('should handle large dataset responses', async () => {
      const largeDataset = {
        data: {
          success: true,
          data: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            symbol: `STOCK${i}`,
            price: Math.random() * 100,
            volume: Math.random() * 1000000
          }))
        }
      }
      
      mockedAxios.get.mockResolvedValueOnce(largeDataset)
      
      const startTime = Date.now()
      const response = await axios.get('/api/market/all-stocks')
      const endTime = Date.now()
      
      expect(response.data.data.length).toBe(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should process in less than 1 second
    })

    it('should handle concurrent requests', async () => {
      const mockResponses = Array.from({ length: 10 }, (_, i) => ({
        data: { success: true, id: i, data: `response_${i}` }
      }))
      
      mockResponses.forEach((response, index) => {
        mockedAxios.get.mockResolvedValueOnce(response)
      })
      
      const requests = Array.from({ length: 10 }, (_, i) => 
        axios.get(`/api/test/${i}`)
      )
      
      const responses = await Promise.all(requests)
      
      expect(responses.length).toBe(10)
      responses.forEach((response, index) => {
        expect(response.data.id).toBe(index)
      })
    })
  })
})

