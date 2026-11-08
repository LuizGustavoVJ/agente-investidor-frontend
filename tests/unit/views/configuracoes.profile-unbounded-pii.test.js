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

const profileMarkup = configuracoes.slice(
  configuracoes.indexOf('<form @submit.prevent="saveProfile"'),
  configuracoes.indexOf('isSavingProfile')
)

const validateProfile = configuracoes.slice(
  configuracoes.indexOf('const validateProfile = () => {'),
  configuracoes.indexOf('const validatePassword = () => {')
)

const saveProfile = configuracoes.slice(
  configuracoes.indexOf('const saveProfile = async () => {'),
  configuracoes.indexOf('const saveInvestorProfile = async () => {')
)

const cadastroNameEmail = cadastro.slice(
  cadastro.indexOf('id="name"'),
  cadastro.indexOf('id="phone"')
)

describe('Configurações/Cadastro — campos de PII sem maxlength', () => {
  it('perfil aceita firstName/lastName/email/phone/bio sem teto de caracteres', () => {
    expect(profileMarkup).toMatch(/id="firstName"/)
    expect(profileMarkup).toMatch(/id="lastName"/)
    expect(profileMarkup).toMatch(/id="email"/)
    expect(profileMarkup).toMatch(/id="phone"/)
    expect(profileMarkup).toMatch(/id="bio"/)
    expect(profileMarkup).toMatch(/<textarea/)

    expect(profileMarkup).not.toMatch(/maxlength/)
    expect(profileMarkup).not.toMatch(/maxLength/)
  })

  it('validateProfile não limita tamanho e saveProfile encaminha o form inteiro', () => {
    expect(validateProfile).toMatch(/firstName\.trim\(\)/)
    expect(validateProfile).toMatch(/lastName\.trim\(\)/)
    expect(validateProfile).toMatch(/email\.trim\(\)/)
    expect(validateProfile).not.toMatch(/length\s*[><]=?\s*\d+/)
    expect(validateProfile).not.toMatch(/bio/)

    expect(saveProfile).toMatch(/updateProfile\(profileForm\.value\)/)
    expect(saveProfile).not.toMatch(/profileForm\.value\.firstName\.trim/)
    expect(saveProfile).not.toMatch(/bio\.slice|bio\.substring/)
  })

  it('Cadastro também não limita name/email — POST /auth/register aceita PII enorme', () => {
    expect(cadastroNameEmail).toMatch(/id="name"/)
    expect(cadastroNameEmail).toMatch(/id="email"/)
    expect(cadastroNameEmail).not.toMatch(/maxlength/)
  })
})
