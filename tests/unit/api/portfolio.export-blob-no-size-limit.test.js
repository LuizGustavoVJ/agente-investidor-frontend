import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { portfolioAPI } from '@/api/portfolio'
import client from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

const clientSource = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const portfolioApiSource = readFileSync(
  resolve(__dirname, '../../../src/api/portfolio.js'),
  'utf8'
)

describe('Portfolio/client — export e relatório blob sem teto de tamanho', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.get.mockResolvedValue({ data: new Blob(['xlsx']) })
  })

  it('axios.create não define maxContentLength nem maxBodyLength', () => {
    const createSrc = clientSource.slice(
      clientSource.indexOf('axios.create('),
      clientSource.indexOf('// Interceptor de requisição')
    )

    expect(createSrc).toMatch(/timeout:\s*30000/)
    expect(createSrc).not.toMatch(/maxContentLength|maxBodyLength|maxContent/)
    expect(clientSource).not.toMatch(/maxContentLength|maxBodyLength/)
  })

  it('exportData e getConsolidatedReport pedem blob sem limite — patrimônio/PII cabem inteiros na memória', async () => {
    const exportFn = portfolioApiSource.slice(
      portfolioApiSource.indexOf('exportData:'),
      portfolioApiSource.indexOf('syncBrokers:')
    )
    const reportFn = portfolioApiSource.slice(
      portfolioApiSource.indexOf('getConsolidatedReport:'),
      portfolioApiSource.indexOf('exportData:')
    )

    expect(exportFn).toMatch(/responseType:\s*'blob'/)
    expect(exportFn).not.toMatch(/maxContentLength|maxBodyLength|onDownloadProgress/)
    expect(reportFn).toMatch(/responseType:\s*format === 'pdf' \? 'blob' : 'json'/)
    expect(reportFn).not.toMatch(/maxContentLength|maxBodyLength/)

    await portfolioAPI.exportData('excel')
    await portfolioAPI.getConsolidatedReport('pdf')

    expect(client.get).toHaveBeenCalledTimes(2)

    const exportCfg = client.get.mock.calls[0][1]
    expect(client.get.mock.calls[0][0]).toBe('/portfolio/export')
    expect(exportCfg.responseType).toBe('blob')
    expect(exportCfg.maxContentLength).toBeUndefined()
    expect(exportCfg.maxBodyLength).toBeUndefined()

    const reportCfg = client.get.mock.calls[1][1]
    expect(client.get.mock.calls[1][0]).toBe('/portfolio/report')
    expect(reportCfg.responseType).toBe('blob')
    expect(reportCfg.maxContentLength).toBeUndefined()
    expect(reportCfg.maxBodyLength).toBeUndefined()
  })
})
