import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const loginSource = readFileSync(
  resolve(__dirname, '../../../src/components/Login.vue'),
  'utf8'
)
const cadastroSource = readFileSync(
  resolve(__dirname, '../../../src/components/Cadastro.vue'),
  'utf8'
)
const configSource = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)
const authApiSource = readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8')

function templateOf(source) {
  const end = source.indexOf('<script setup>')
  return end === -1 ? source : source.slice(0, end)
}

describe('Senha — Login, Cadastro e Configurações sem maxlength', () => {
  it('input de senha do Login não tem maxlength — validateForm só exige mínimo 6', () => {
    const template = templateOf(loginSource)
    const passwordInput = template.slice(
      template.indexOf('id="password"'),
      template.indexOf('id="password"') + 450
    )
    const validateFn = loginSource.slice(
      loginSource.indexOf('const validateForm'),
      loginSource.indexOf('const handleLogin')
    )

    expect(passwordInput).toMatch(/v-model="form.password"/)
    expect(passwordInput).not.toMatch(/maxlength|maxLength/)
    expect(validateFn).toMatch(/password\.length < 6/)
    expect(validateFn).not.toMatch(/password\.length\s*[>=].*(72|128|256)/)
    expect(validateFn).not.toMatch(/maxlength|MAX_PASSWORD/)
  })

  it('inputs de senha do Cadastro não têm maxlength — validateForm só exige mínimo 8', () => {
    const template = templateOf(cadastroSource)
    const passwordBlock = template.slice(
      template.indexOf('id="password"'),
      template.indexOf('id="confirmPassword"')
    )
    const confirmBlock = template.slice(
      template.indexOf('id="confirmPassword"'),
      template.indexOf('form.acceptTerms')
    )
    const validateFn = cadastroSource.slice(
      cadastroSource.indexOf('const validateForm'),
      cadastroSource.indexOf('const handleRegister')
    )

    expect(passwordBlock).toMatch(/v-model="form.password"/)
    expect(passwordBlock).not.toMatch(/maxlength|maxLength/)
    expect(confirmBlock).not.toMatch(/maxlength|maxLength/)
    expect(validateFn).toMatch(/password\.length < 8/)
    expect(validateFn).not.toMatch(/password\.length\s*[>=].*(72|128|256)/)
  })

  it('troca de senha em Configurações não limita tamanho — validatePassword só checa mínimo 8', () => {
    const template = templateOf(configSource)
    const currentInput = template.slice(
      template.indexOf('id="currentPassword"'),
      template.indexOf('id="newPassword"')
    )
    const newInput = template.slice(
      template.indexOf('id="newPassword"'),
      template.indexOf('id="confirmPassword"')
    )
    const validateFn = configSource.slice(
      configSource.indexOf('const validatePassword'),
      configSource.indexOf('const saveProfile')
    )

    expect(currentInput).not.toMatch(/maxlength|maxLength/)
    expect(newInput).not.toMatch(/maxlength|maxLength/)
    expect(validateFn).toMatch(/newPassword\.length < 8/)
    expect(validateFn).not.toMatch(/newPassword\.length\s*[>=].*(72|128|256)/)
  })

  it('login, register e changePassword encaminham a senha crua — API não trunca no cliente', () => {
    const loginFn = authApiSource.slice(
      authApiSource.indexOf('login:'),
      authApiSource.indexOf('register:')
    )
    const registerFn = authApiSource.slice(
      authApiSource.indexOf('register:'),
      authApiSource.indexOf('logout:')
    )
    const changeFn = authApiSource.slice(
      authApiSource.indexOf('changePassword:'),
      authApiSource.indexOf('requestPasswordReset:')
    )

    expect(loginFn).toMatch(/password:\s*credentials\.password/)
    expect(registerFn).toMatch(/password:\s*userData\.password/)
    expect(changeFn).toMatch(/newPassword:\s*passwordData\.newPassword/)
    expect(authApiSource).not.toMatch(/\.slice\(0,\s*72\)|maxLength|truncate/)
  })
})
