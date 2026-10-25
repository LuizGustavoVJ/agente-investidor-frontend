import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { authAPI } from '@/api/auth'

const src = (rel) => readFileSync(resolve(process.cwd(), rel), 'utf8')

describe('Auth — verifyEmail e confirmPasswordReset existem e não têm UI/rota', () => {
  it('API expõe verifyEmail e confirmPasswordReset', () => {
    expect(typeof authAPI.verifyEmail).toBe('function')
    expect(typeof authAPI.confirmPasswordReset).toBe('function')
    expect(typeof authAPI.requestPasswordReset).toBe('function')
    expect(typeof authAPI.resendVerificationEmail).toBe('function')
  })

  it('router não declara /verificar-email, /redefinir-senha nem EmailVerification', () => {
    const routerSrc = src('src/router/index.js')
    expect(routerSrc).not.toMatch(/verificar-email|redefinir-senha|reset-password|EmailVerification/)
    expect(routerSrc).toContain("name: 'Error404'")
    expect(routerSrc).toContain('/:pathMatch(.*)*')
  })

  it('Login e Cadastro nunca chamam verifyEmail, confirmPasswordReset nem resendVerificationEmail', () => {
    const login = src('src/components/Login.vue')
    const cadastro = src('src/components/Cadastro.vue')
    const combined = login + cadastro

    expect(combined).not.toMatch(/verifyEmail|confirmPasswordReset|resendVerificationEmail|requestPasswordReset/)
    expect(login).toContain('/recuperar-senha')
  })
})
