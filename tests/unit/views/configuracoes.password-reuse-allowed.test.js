import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const source = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)

const validatePassword = source.slice(
  source.indexOf('const validatePassword = () => {'),
  source.indexOf('const saveProfile = async () => {')
)

const strengthFn = source.slice(
  source.indexOf('const getPasswordStrengthPercent = () => {'),
  source.indexOf('const getPasswordStrengthClass = () => {')
)

describe('Configurações — troca de senha aceita reuso e senha fraca', () => {
  it('validatePassword só exige 8 caracteres e confirmação — não compara com a senha atual', () => {
    expect(validatePassword).toMatch(/newPassword\.length < 8/)
    expect(validatePassword).toMatch(/newPassword !== passwordForm\.value\.confirmPassword/)
    expect(validatePassword).toMatch(/!passwordForm\.value\.currentPassword/)

    expect(validatePassword).not.toMatch(/=== passwordForm\.value\.currentPassword/)
    expect(validatePassword).not.toMatch(/!== passwordForm\.value\.currentPassword/)
    expect(validatePassword).not.toMatch(/toLowerCase\(\)|includes\(.*current/)
  })

  it('aaaaaaaa como atual e nova passa no mínimo 8 — medidor não exige maiúscula, número ou símbolo', () => {
    expect(validatePassword).not.toMatch(/\/\[A-Z\]\//)
    expect(validatePassword).not.toMatch(/\/\[0-9\]\//)
    expect(validatePassword).not.toMatch(/\/\[\^A-Za-z0-9\]\//)

    expect(strengthFn).toMatch(/password\.length >= 8/)
    expect(strengthFn).toMatch(/\[a-z\]/)
    expect(strengthFn).not.toMatch(/\[\^A-Za-z0-9\]/)
  })
})
