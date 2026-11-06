import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const configSource = readFileSync(
  resolve(__dirname, '../../../src/views/Configuracoes.vue'),
  'utf8'
)

describe('Configurações — privacidade e notificações nascem opt-out (LGPD)', () => {
  it('privacyForm liga analytics e personalization por padrão — o usuário precisa desligar coleta', () => {
    const privacyState = configSource.slice(
      configSource.indexOf('const privacyForm = ref('),
      configSource.indexOf('const passwordForm = ref(')
    )

    expect(privacyState).toMatch(/analytics:\s*true/)
    expect(privacyState).toMatch(/personalization:\s*true/)
    expect(privacyState).toMatch(/aggregatedData:\s*false/)
    expect(privacyState).not.toMatch(/analytics:\s*false/)
    expect(privacyState).not.toMatch(/personalization:\s*false/)
  })

  it('loadUserData só copia privacySettings se o backend mandar — sem campo, os defaults true permanecem', () => {
    const loadFn = configSource.slice(
      configSource.indexOf('const loadUserData'),
      configSource.indexOf('// Lifecycle')
    )

    expect(loadFn).toMatch(/if \(userData\.privacySettings\)/)
    expect(loadFn).toMatch(/privacyForm\.value = \{ \.\.\.userData\.privacySettings \}/)
    expect(loadFn).not.toMatch(/privacyForm\.value\.analytics\s*=\s*false/)
    expect(loadFn).not.toMatch(/opt-?in|consent|finalidade|baseLegal/)
  })

  it('savePrivacy encaminha o form inteiro — analytics:true sai no update sem consentimento explícito', () => {
    const saveFn = configSource.slice(
      configSource.indexOf('const savePrivacy'),
      configSource.indexOf('const changePassword')
    )

    expect(saveFn).toMatch(/authStore\.updatePrivacySettings\(privacyForm\.value\)/)
    expect(saveFn).not.toMatch(/analytics:\s*false|consent|optIn/)
  })

  it('notificationsForm liga e-mail e push por padrão — relatórios e recomendações IA já vêm marcados', () => {
    const notificationsState = configSource.slice(
      configSource.indexOf('const notificationsForm = ref('),
      configSource.indexOf('const privacyForm = ref(')
    )

    expect(notificationsState).toMatch(/weeklyReports:\s*true/)
    expect(notificationsState).toMatch(/marketAlerts:\s*true/)
    expect(notificationsState).toMatch(/aiRecommendations:\s*true/)
    expect(notificationsState).toMatch(/criticalAlerts:\s*true/)
    expect(notificationsState).toMatch(/syncStatus:\s*true/)
    expect(notificationsState).not.toMatch(/weeklyReports:\s*false/)
    expect(notificationsState).not.toMatch(/aiRecommendations:\s*false/)
  })
})
