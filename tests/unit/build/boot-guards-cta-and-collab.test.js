import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { mount } from '@vue/test-utils'
import Hero from '@/components/Hero.vue'
import NewsSection from '@/components/NewsSection.vue'
import FeatureCards from '@/components/FeatureCards.vue'
import Header from '@/components/Header.vue'

const src = (relative) =>
  readFileSync(resolve(__dirname, '../../../src', relative), 'utf8')

describe('Boot, guards mortos e CTAs sem efeito', () => {
  it('main.js não chama authStore.initialize() nem instala errorHandler', () => {
    const main = src('main.js')
    expect(main).not.toMatch(/initialize\s*\(/)
    expect(main).not.toMatch('errorHandler')
    expect(main).toMatch('app.use(router)')
    expect(main).toMatch('app.mount')
  })

  it('router não aplica requirePermission, requireEmailVerified, requireCompleteProfile nem applyMiddlewares', () => {
    const routerSrc = src('router/index.js')
    expect(routerSrc).toMatch('requireAuth')
    expect(routerSrc).toMatch('requireGuest')
    expect(routerSrc).not.toMatch('requirePermission')
    expect(routerSrc).not.toMatch('requireEmailVerified')
    expect(routerSrc).not.toMatch('requireCompleteProfile')
    expect(routerSrc).not.toMatch('requireBrokerConnection')
    expect(routerSrc).not.toMatch('applyMiddlewares')
    expect(routerSrc).not.toMatch('/recuperar-senha')
    expect(routerSrc).not.toMatch('/metas')
  })

  it('views lazy do router não existem no disco', () => {
    const views = resolve(__dirname, '../../../src/views')
    for (const name of [
      'Portfolio.vue',
      'Analises.vue',
      'Metodologias.vue',
      'Relatorios.vue',
      'Perfil.vue',
      'Ajuda.vue',
      'Sobre.vue',
      'Termos.vue',
      'Privacidade.vue',
      'Maintenance.vue',
      'Forbidden.vue'
    ]) {
      expect(existsSync(resolve(views, name))).toBe(false)
    }
  })

  it('Hero captura e-mail com @submit.prevent sem handler nem rota para cadastro', () => {
    const wrapper = mount(Hero)
    const form = wrapper.find('form.email-form')
    expect(form.exists()).toBe(true)
    expect(form.attributes('action')).toBeUndefined()
    expect(src('components/Hero.vue')).toMatch('@submit.prevent>')
    expect(src('components/Hero.vue')).not.toMatch('router.push')
    expect(src('components/Hero.vue')).not.toMatch('handleSubmit')
    expect(wrapper.find('a').exists()).toBe(false)
    wrapper.unmount()
  })

  it('NewsSection usa notícias hardcoded e cards não são links', () => {
    const wrapper = mount(NewsSection)
    expect(wrapper.findAll('.news-card').length).toBe(4)
    expect(wrapper.findAll('a').length).toBe(0)
    expect(src('components/NewsSection.vue')).toMatch('Bitcoin recobra fôlego')
    expect(src('components/NewsSection.vue')).not.toMatch('fetch(')
    expect(src('components/NewsSection.vue')).not.toMatch('axios')
    wrapper.unmount()
  })

  it('FeatureCards não navegam — sem router-link nem href', () => {
    const wrapper = mount(FeatureCards)
    expect(wrapper.findAll('a').length).toBe(0)
    expect(wrapper.findAll('button').length).toBe(0)
    expect(wrapper.findAll('.feature-card').length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('Header sempre mostra Entrar/Criar conta, sem ramo autenticado', () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>', props: ['to'] }
        }
      }
    })
    expect(wrapper.text()).toMatch(/Entrar/)
    expect(wrapper.text()).toMatch(/Criar conta/)
    expect(src('components/Header.vue')).not.toMatch('isAuthenticated')
    expect(src('components/Header.vue')).not.toMatch('useAuthStore')
    wrapper.unmount()
  })

  it('followTrader/copyTrader não atualizam contadores nem a lista copiedStrategies', () => {
    const collab = src('components/CollaborativeFeatures.vue')
    expect(collab).toMatch(/followedTraders:\s*5/)
    expect(collab).toMatch(/copiedStrategies:\s*2/)
    const followBlock = collab.slice(
      collab.indexOf('const followTrader'),
      collab.indexOf('const copyTrader')
    )
    expect(followBlock).not.toMatch('followedTraders')
    expect(followBlock).not.toMatch('copiedStrategies')
    const copyBlock = collab.slice(
      collab.indexOf('const copyTrader'),
      collab.indexOf('const adjustCopy')
    )
    expect(copyBlock).not.toMatch('copiedStrategies.push')
    expect(copyBlock).not.toMatch('socialPortfolio')
  })

  it('Error500 não oferece retry nem report — só volta para Home', () => {
    const err = src('components/Error500.vue')
    expect(err).toMatch('to="/"')
    expect(err).not.toMatch('retry')
    expect(err).not.toMatch('reload')
    expect(err).not.toMatch('window.location')
  })
})
