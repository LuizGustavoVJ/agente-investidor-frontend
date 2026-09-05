import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

const routerSource = readFileSync(resolve(__dirname, '../../../src/router/index.js'), 'utf8')
const viewsDir = resolve(__dirname, '../../../src/views')

const lazyViews = [...routerSource.matchAll(/import\('@\/views\/([^']+)'\)/g)].map(
  (match) => match[1]
)

const existingLazyViews = lazyViews.filter((file) => existsSync(resolve(viewsDir, file)))
const missingLazyViews = lazyViews.filter((file) => !existsSync(resolve(viewsDir, file)))

const Dummy = { template: '<div />' }

describe('Router — views lazy e contrato de rotas', () => {
  it('só deixa de resolver as views já conhecidas como ausentes', () => {
    expect(existingLazyViews.sort()).toEqual([
      'Configuracoes.vue',
      'Corretoras.vue',
      'Metas.vue'
    ])

    expect(missingLazyViews.sort()).toEqual([
      'Ajuda.vue',
      'Analises.vue',
      'Forbidden.vue',
      'Maintenance.vue',
      'Metodologias.vue',
      'Perfil.vue',
      'Portfolio.vue',
      'Privacidade.vue',
      'Relatorios.vue',
      'Sobre.vue',
      'Termos.vue'
    ])
  })

  it('importa as views lazy que existem no repositório', async () => {
    for (const file of existingLazyViews) {
      const module = await import(`@/views/${file}`)
      expect(module.default).toBeTruthy()
    }
  })

  it('protege /metas com requireAuth — destino usado pelo Dashboard', () => {
    const block = routerSource.split("path: '/metas'")[1]?.slice(0, 400)
    expect(block).toBeTruthy()
    expect(block).toContain("name: 'Metas'")
    expect(block).toContain("import('@/views/Metas.vue')")
    expect(block).toContain('beforeEnter: requireAuth')
    expect(block).toContain('requiresAuth: true')
  })

  it('mantém no fonte o afterEach de SEO e o fallback de erro de chunk', () => {
    expect(routerSource).toContain('document.title = to.meta.title')
    expect(routerSource).toContain('meta[name="description"]')
    expect(routerSource).toContain("error.name === 'ChunkLoadError'")
    expect(routerSource).toContain('window.location.reload()')
    expect(routerSource).toContain("router.push('/500')")
  })
})

describe('Router — afterEach e onError (espelho do handler de produção)', () => {
  let router
  let descriptionMeta

  const attachProductionHooks = (instance) => {
    instance.afterEach((to) => {
      if (to.meta.title) {
        document.title = to.meta.title
      }

      if (to.meta.description) {
        const metaDescription = document.querySelector('meta[name="description"]')
        if (metaDescription) {
          metaDescription.setAttribute('content', to.meta.description)
        }
      }
    })

    instance.onError((error) => {
      if (error.name === 'ChunkLoadError') {
        window.location.reload()
      } else {
        instance.push('/500')
      }
    })
  }

  beforeEach(async () => {
    window.location.reload.mockClear?.()
    descriptionMeta = document.querySelector('meta[name="description"]')
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta')
      descriptionMeta.setAttribute('name', 'description')
      document.head.appendChild(descriptionMeta)
    }
    descriptionMeta.setAttribute('content', '')

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'Home',
          component: Dummy,
          meta: { title: 'Home', description: 'Página inicial', public: true }
        },
        {
          path: '/login',
          name: 'Login',
          component: Dummy,
          meta: {
            title: 'Login - Agente Investidor',
            description: 'Faça login na sua conta',
            public: true
          }
        },
        { path: '/500', name: 'Error500', component: Dummy, meta: { public: true } }
      ]
    })

    attachProductionHooks(router)
    await router.push('/')
    await router.isReady()
  })

  afterEach(async () => {
    await router.push('/').catch(() => {})
    await flushPromises()
  })

  it('atualiza título e meta description após a navegação', async () => {
    await router.push('/login')
    await flushPromises()

    expect(document.title).toBe('Login - Agente Investidor')
    expect(descriptionMeta.getAttribute('content')).toBe('Faça login na sua conta')
  })

  it('não altera a description quando a tag meta não existe', async () => {
    descriptionMeta.remove()
    await router.push('/')
    await flushPromises()
    expect(document.title).toBe('Home')
    expect(document.querySelector('meta[name="description"]')).toBeNull()
  })

  it('recarrega a página quando o chunk da rota falha', async () => {
    router.addRoute({
      path: '/chunk-fail',
      name: 'ChunkFail',
      component: () => {
        const error = new Error('Loading chunk failed')
        error.name = 'ChunkLoadError'
        return Promise.reject(error)
      },
      meta: { public: true }
    })

    await router.push('/chunk-fail').catch(() => {})
    await flushPromises()

    expect(window.location.reload).toHaveBeenCalled()
  })

  it('redireciona para /500 em outros erros de navegação', async () => {
    router.addRoute({
      path: '/nav-fail',
      name: 'NavFail',
      component: () => Promise.reject(new Error('falha ao resolver componente')),
      meta: { public: true }
    })

    await router.push('/nav-fail').catch(() => {})
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/500')
    expect(window.location.reload).not.toHaveBeenCalled()
  })
})
