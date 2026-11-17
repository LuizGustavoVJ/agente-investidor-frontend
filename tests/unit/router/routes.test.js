import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createPinia, setActivePinia } from 'pinia'
import {
  requireAuth,
  requireGuest,
  requireEmailVerified,
  requireCompleteProfile,
  requirePermission
} from '@/middleware/auth'

const routerSrc = readFileSync(
  resolve(process.cwd(), 'src/router/index.js'),
  'utf8'
)

describe('Router — rotas ausentes, guards e título', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('não declara /metas nem rotas de verificação/perfil usadas pelo middleware', () => {
    expect(routerSrc).toMatch(/name:\s*'Dashboard'/)
    expect(routerSrc).toMatch(/name:\s*'Corretoras'/)
    expect(routerSrc).toMatch(/path:\s*'\/configuracoes'/)
    expect(routerSrc).not.toMatch(/name:\s*'Metas'/)
    expect(routerSrc).not.toMatch(/path:\s*'\/metas'/)
    expect(routerSrc).not.toMatch(/name:\s*'EmailVerification'/)
    expect(routerSrc).not.toMatch(/name:\s*'ProfileSetup'/)
    expect(routerSrc).not.toMatch(/path:\s*'\/corretoras\/:id'/)
    expect(routerSrc).not.toMatch(/path:\s*'\/corretoras\/:id\/configuracao'/)
  })

  it('protege dashboard/corretoras/configurações com requireAuth e login/cadastro com requireGuest', () => {
    expect(routerSrc).toMatch(/name:\s*'Dashboard'[\s\S]*?beforeEnter:\s*requireAuth/)
    expect(routerSrc).toMatch(/name:\s*'Corretoras'[\s\S]*?beforeEnter:\s*requireAuth/)
    expect(routerSrc).toMatch(/name:\s*'Configuracoes'[\s\S]*?beforeEnter:\s*requireAuth/)
    expect(routerSrc).toMatch(/name:\s*'Login'[\s\S]*?beforeEnter:\s*requireGuest/)
    expect(routerSrc).toMatch(/name:\s*'Cadastro'[\s\S]*?beforeEnter:\s*requireGuest/)
    expect(routerSrc).toMatch(/name:\s*'Ajuda'[\s\S]*?meta:\s*\{[\s\S]*?public:\s*true/)
  })

  it('scrollBehavior restaura posição salva ou volta ao topo', () => {
    expect(routerSrc).toContain('if (savedPosition)')
    expect(routerSrc).toContain('return savedPosition')
    expect(routerSrc).toContain('return { top: 0 }')
  })

  it('afterEach aplica título e description da meta', () => {
    expect(routerSrc).toContain('document.title = to.meta.title')
    expect(routerSrc).toContain("document.querySelector('meta[name=\"description\"]')")
  })

  it('ChunkLoadError recarrega a página; outros erros vão para /500', () => {
    expect(routerSrc).toContain("error.name === 'ChunkLoadError'")
    expect(routerSrc).toContain('window.location.reload()')
    expect(routerSrc).toContain("router.push('/500')")
  })

  it('middleware de e-mail, perfil e permissão aponta para rotas que o arquivo não declara', () => {
    expect(requireEmailVerified.toString()).toContain('EmailVerification')
    expect(requireCompleteProfile.toString()).toContain('ProfileSetup')
    expect(requirePermission('admin').toString()).toContain('Forbidden')
    expect(typeof requireAuth).toBe('function')
    expect(typeof requireGuest).toBe('function')
    expect(routerSrc).toMatch(/name:\s*'Forbidden'/)
    expect(routerSrc).not.toMatch(/name:\s*'EmailVerification'/)
    expect(routerSrc).not.toMatch(/name:\s*'ProfileSetup'/)
  })
})
