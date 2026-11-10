import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = resolve(__dirname, '../../..')
const source = readFileSync(resolve(root, 'src/views/Configuracoes.vue'), 'utf8')
const cadastroSource = readFileSync(resolve(root, 'src/components/Cadastro.vue'), 'utf8')
const loginSource = readFileSync(resolve(root, 'src/components/Login.vue'), 'utf8')

const profileFormMarkup = source.slice(
  source.indexOf('<form @submit.prevent="saveProfile"'),
  source.indexOf('isSavingProfile')
)

describe('Configurações — perfil sem autocomplete de identidade', () => {
  it('firstName, lastName, email, phone e birthDate não declaram autocomplete', () => {
    expect(profileFormMarkup).toMatch(/id="firstName"/)
    expect(profileFormMarkup).toMatch(/id="lastName"/)
    expect(profileFormMarkup).toMatch(/id="email"/)
    expect(profileFormMarkup).toMatch(/id="phone"/)
    expect(profileFormMarkup).toMatch(/id="birthDate"/)
    expect(profileFormMarkup).toMatch(/type="email"/)
    expect(profileFormMarkup).toMatch(/type="tel"/)
    expect(profileFormMarkup).toMatch(/type="date"/)

    expect(profileFormMarkup).not.toMatch(/autocomplete\s*=/)
    expect(profileFormMarkup).not.toMatch(/autocomplete="given-name"/)
    expect(profileFormMarkup).not.toMatch(/autocomplete="family-name"/)
    expect(profileFormMarkup).not.toMatch(/autocomplete="email"/)
    expect(profileFormMarkup).not.toMatch(/autocomplete="tel"/)
    expect(profileFormMarkup).not.toMatch(/autocomplete="bday"/)
  })

  it('Login e Cadastro já marcam autocomplete — a lacuna é só no perfil de Configurações', () => {
    expect(loginSource).toMatch(/autocomplete="email"/)
    expect(cadastroSource).toMatch(/autocomplete="name"/)
    expect(cadastroSource).toMatch(/autocomplete="email"/)
    expect(cadastroSource).toMatch(/autocomplete="tel"/)
  })
})
