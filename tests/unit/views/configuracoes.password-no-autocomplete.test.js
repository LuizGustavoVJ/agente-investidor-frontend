import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const source = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)

const passwordFormMarkup = source.slice(
  source.indexOf('<form @submit.prevent="changePassword"'),
  source.indexOf('isChangingPassword')
)

const loginSource = readFileSync(
  resolve(__dirname, '../../../src/components/Login.vue'),
  'utf8'
)

const cadastroSource = readFileSync(
  resolve(__dirname, '../../../src/components/Cadastro.vue'),
  'utf8'
)

describe('Configurações — inputs de senha sem autocomplete', () => {
  it('os três campos de troca de senha não declaram autocomplete current/new-password', () => {
    expect(passwordFormMarkup).toMatch(/id="currentPassword"/)
    expect(passwordFormMarkup).toMatch(/id="newPassword"/)
    expect(passwordFormMarkup).toMatch(/id="confirmPassword"/)
    expect(passwordFormMarkup).toMatch(/type="password"/)

    expect(passwordFormMarkup).not.toMatch(/autocomplete\s*=/)
    expect(passwordFormMarkup).not.toMatch(/autocomplete="current-password"/)
    expect(passwordFormMarkup).not.toMatch(/autocomplete="new-password"/)
  })

  it('Login e Cadastro já marcam autocomplete — a lacuna é só na troca em Configurações', () => {
    expect(loginSource).toMatch(/autocomplete="current-password"/)
    expect(cadastroSource).toMatch(/autocomplete="new-password"/)
  })
})
