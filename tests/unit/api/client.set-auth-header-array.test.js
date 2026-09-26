import { describe, it, expect, afterEach } from 'vitest'
import client, { setAuthHeader } from '@/api/client'

describe('setAuthHeader — valores truthy não-string', () => {
  afterEach(() => {
    delete client.defaults.headers.common['Authorization']
  })

  it('array vazio grava Bearer vazio porque [] é truthy', () => {
    setAuthHeader([])

    expect(client.defaults.headers.common['Authorization']).toBe('Bearer ')
  })

  it('true grava Bearer true', () => {
    setAuthHeader(true)

    expect(client.defaults.headers.common['Authorization']).toBe('Bearer true')
  })

  it('objeto grava Bearer [object Object]', () => {
    setAuthHeader({})

    expect(client.defaults.headers.common['Authorization']).toBe('Bearer [object Object]')
  })
})
