import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const configuracoes = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)

const cadastro = readFileSync(
  resolve(__dirname, '../../../src/components/Cadastro.vue'),
  'utf8'
)

const profilePhoneMarkup = configuracoes.slice(
  configuracoes.indexOf('<label for="phone">Telefone</label>'),
  configuracoes.indexOf('<label for="birthDate">')
)

const validateProfile = configuracoes.slice(
  configuracoes.indexOf('const validateProfile = () => {'),
  configuracoes.indexOf('const validatePassword = () => {')
)

describe('Configurações — telefone do perfil sem máscara nem regex', () => {
  it('input tel do perfil não tem pattern, mask nem watcher — Cadastro exige (11) 99999-9999', () => {
    expect(profilePhoneMarkup).toMatch(/id="phone"/)
    expect(profilePhoneMarkup).toMatch(/type="tel"/)
    expect(profilePhoneMarkup).toMatch(/v-model="profileForm\.phone"/)

    expect(profilePhoneMarkup).not.toMatch(/pattern=/)
    expect(profilePhoneMarkup).not.toMatch(/@input/)
    expect(profilePhoneMarkup).not.toMatch(/@blur/)
    expect(profilePhoneMarkup).not.toMatch(/maxlength/)

    expect(cadastro).toContain('/^\\(\\d{2}\\)\\s\\d{4,5}-\\d{4}$/')
    expect(cadastro).toContain('watch(() => form.value.phone')
    expect(cadastro).toContain("replace(/\\D/g, '')")

    expect(configuracoes).not.toContain('/^\\(\\d{2}\\)\\s\\d{4,5}-\\d{4}$/')
    expect(configuracoes).not.toContain('watch(() => profileForm.value.phone')
  })

  it('validateProfile ignora phone — saveProfile manda o valor cru no updateProfile', () => {
    expect(validateProfile).toMatch(/firstName/)
    expect(validateProfile).toMatch(/lastName/)
    expect(validateProfile).toMatch(/email/)
    expect(validateProfile).not.toMatch(/phone/)
    expect(validateProfile).not.toContain('replace(/\\D')
  })
})
