import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, vi } from 'vitest'

const source = readFileSync(
  resolve(__dirname, '../../../src/router/index.js'),
  'utf8'
)

const handleNavigationError = (error, reload, push500) => {
  if (error.name === 'ChunkLoadError') {
    reload()
  } else {
    push500()
  }
}

describe('Router.onError — ChunkLoadError recarrega sem limite', () => {
  it('ChunkLoadError chama window.location.reload; qualquer outro erro vai para /500', () => {
    const handler = source.slice(
      source.indexOf('router.onError((error) => {'),
      source.lastIndexOf('export default router')
    )

    expect(handler).toMatch(/if \(error\.name === 'ChunkLoadError'\)/)
    expect(handler).toMatch(/window\.location\.reload\(\)/)
    expect(handler).toMatch(/router\.push\('\/500'\)/)
    expect(handler).not.toMatch(/sessionStorage|localStorage|retryCount|backoff|location\.href/)
    expect(handler).not.toMatch(/reload\(\s*\)\s*;\s*return/)
  })

  it('o mesmo ChunkLoadError dispara reload de novo — chunk ausente entra em loop de recarga', () => {
    const reload = vi.fn()
    const push500 = vi.fn()
    const chunkError = { name: 'ChunkLoadError', message: 'Loading chunk 3 failed' }

    handleNavigationError(chunkError, reload, push500)
    handleNavigationError(chunkError, reload, push500)

    expect(reload).toHaveBeenCalledTimes(2)
    expect(push500).not.toHaveBeenCalled()
  })
})
