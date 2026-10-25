import { describe, it, expect, beforeEach, vi } from 'vitest'
import client from '@/api/client'
import { portfolioAPI } from '@/api/portfolio'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('API — mutações de transação e meta interpolam id sem encode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.put.mockResolvedValue({ data: { success: true, data: {} } })
    client.delete.mockResolvedValue({ data: { success: true } })
  })

  it('updateTransaction e deleteTransaction interpolam tx/2026-01 cru', () => {
    portfolioAPI.updateTransaction('tx/2026-01', { quantity: 10 })
    portfolioAPI.deleteTransaction('tx/2026-01')

    const putUrl = client.put.mock.calls[0][0]
    const delUrl = client.delete.mock.calls[0][0]
    expect(putUrl).toBe('/portfolio/transactions/tx/2026-01')
    expect(delUrl).toBe('/portfolio/transactions/tx/2026-01')
    expect(putUrl).not.toBe('/portfolio/transactions/tx%2F2026-01')
    expect(putUrl.split('/')).toEqual(['', 'portfolio', 'transactions', 'tx', '2026-01'])
  })

  it('updateGoal e deleteGoal interpolam meta/casa#1 sem encode', () => {
    portfolioAPI.updateGoal('meta/casa#1', { title: 'Casa' })
    portfolioAPI.deleteGoal('meta/casa#1')

    const putUrl = client.put.mock.calls[0][0]
    const delUrl = client.delete.mock.calls[0][0]
    expect(putUrl).toBe('/portfolio/goals/meta/casa#1')
    expect(delUrl).toBe('/portfolio/goals/meta/casa#1')
    expect(putUrl).not.toBe('/portfolio/goals/meta%2Fcasa%231')
  })
})
