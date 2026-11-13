import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const gitignore = readFileSync(resolve(__dirname, '../../../.gitignore'), 'utf8')
const client = readFileSync(resolve(__dirname, '../../../src/api/client.js'), 'utf8')
const middleware = readFileSync(
  resolve(__dirname, '../../../src/middleware/auth.js'),
  'utf8'
)

describe('.gitignore — ficheiros .env da Vite podem ir para o git', () => {
  it('ignora *.local mas não .env, .env.production nem .env.development', () => {
    expect(gitignore).toMatch(/^\*\.local$/m)
    expect(gitignore).not.toMatch(/^\.env$/m)
    expect(gitignore).not.toMatch(/^\.env\.\*$/m)
    expect(gitignore).not.toMatch(/^\.env\.production$/m)
    expect(gitignore).not.toMatch(/^\.env\.development$/m)
  })

  it('a SPA lê VITE_API_BASE_URL e VITE_MAINTENANCE_MODE — um .env commitido vaza origem da API e modo de manutenção', () => {
    expect(client).toMatch(/import\.meta\.env\.VITE_API_BASE_URL/)
    expect(middleware).toMatch(/import\.meta\.env\.VITE_MAINTENANCE_MODE/)
    expect(gitignore).toMatch(/node_modules/)
    expect(gitignore).toMatch(/^dist$/m)
  })
})
