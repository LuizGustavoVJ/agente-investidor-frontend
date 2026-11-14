import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const client = readFileSync(
  resolve(__dirname, '../../../src/api/client.js'),
  'utf8'
)
const auth = readFileSync(
  resolve(__dirname, '../../../src/api/auth.js'),
  'utf8'
)

describe('HTTP client — interceptor de DEV loga o body da requisição', () => {
  it('em DEV faz console.log do config.data inteiro, sem redigir password/token', () => {
    const interceptor = client.slice(
      client.indexOf('client.interceptors.request.use'),
      client.indexOf('client.interceptors.response.use')
    )

    expect(interceptor).toMatch(/if \(import\.meta\.env\.DEV\)/)
    expect(interceptor).toMatch(/console\.log\(`🚀 \$\{config\.method\?\.toUpperCase\(\)\} \$\{config\.url\}`/)
    expect(interceptor).toMatch(/data:\s*config\.data/)
    expect(interceptor).not.toMatch(/password|redact|sanitize|omit|\[REDACTED\]/i)
  })

  it('login e register POSTAM password em texto no body — o log de DEV vaza credencial no console', () => {
    expect(auth).toMatch(/client\.post\('\/auth\/login'/)
    expect(auth).toMatch(/password:\s*credentials\.password/)
    expect(auth).toMatch(/client\.post\('\/auth\/register'/)
    expect(auth).toMatch(/password:\s*userData\.password/)
    expect(auth).toMatch(/confirmPassword:\s*userData\.confirmPassword/)
  })
})
