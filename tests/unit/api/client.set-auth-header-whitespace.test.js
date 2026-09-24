import { describe, it, expect, afterEach } from 'vitest'
import client, { setAuthHeader } from '@/api/client'

describe('setAuthHeader — token vazio vs só espaços', () => {
  afterEach(() => {
    delete client.defaults.headers.common['Authorization']
  })

  it('string vazia é falsy e remove o header Authorization', () => {
    client.defaults.headers.common['Authorization'] = 'Bearer previous'
    setAuthHeader('')

    expect(client.defaults.headers.common['Authorization']).toBeUndefined()
  })

  it('espaços são truthy e gravam Bearer com token em branco', () => {
    setAuthHeader('   ')

    expect(client.defaults.headers.common['Authorization']).toBe('Bearer    ')
  })

  it('a string "undefined" grava Bearer undefined em vez de limpar', () => {
    setAuthHeader('undefined')

    expect(client.defaults.headers.common['Authorization']).toBe('Bearer undefined')
  })
})
