import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const configSource = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)
const cadastroSource = readFileSync(
  resolve(__dirname, '../../../src/components/Cadastro.vue'),
  'utf8'
)
const authApiSource = readFileSync(resolve(__dirname, '../../../src/api/auth.js'), 'utf8')

describe('Cadastro/Configurações — menor de idade e data futura passam sem trava', () => {
  it('Cadastro não pede birthDate, CPF nem idade — a conta é criada sem gate etário', () => {
    const template = cadastroSource.slice(0, cadastroSource.indexOf('<script setup>'))
    const formState = cadastroSource.slice(
      cadastroSource.indexOf('const form = ref('),
      cadastroSource.indexOf('const errors = ref(')
    )

    expect(template).not.toMatch(/birthDate|nascimento|\bCPF\b|\bcpf\b|\bidade\b|type="date"/)
    expect(formState).toMatch(/name:|email:|password:/)
    expect(formState).not.toMatch(/birthDate|\bcpf\b|\bidade\b/)
  })

  it('validateProfile ignora birthDate — data futura ou de menor segue para updateProfile', () => {
    const validateFn = configSource.slice(
      configSource.indexOf('const validateProfile'),
      configSource.indexOf('const validatePassword')
    )
    const saveFn = configSource.slice(
      configSource.indexOf('const saveProfile'),
      configSource.indexOf('const saveInvestorProfile')
    )

    expect(validateFn).toMatch(/firstName|lastName|email/)
    expect(validateFn).not.toMatch(/birthDate|nascimento|idade|age|18|menor/)
    expect(validateFn).not.toMatch(/getFullYear|Date\.now|new Date/)

    expect(saveFn).toMatch(/authStore\.updateProfile\(profileForm\.value\)/)
    expect(configSource).toMatch(/v-model="profileForm.birthDate"/)
  })

  it('authAPI.updateProfile encaminha o objeto inteiro — birthDate entra no PUT sem whitelist etária', () => {
    const updateFn = authApiSource.slice(
      authApiSource.indexOf('updateProfile:'),
      authApiSource.indexOf('changePassword:')
    )

    expect(updateFn).toMatch(/client\.put\('\/auth\/profile',\s*profileData\)/)
    expect(updateFn).not.toMatch(/birthDate|age|18/)
  })
})
