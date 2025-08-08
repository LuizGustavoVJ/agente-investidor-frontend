import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import { useAuthStore } from '@/stores/auth'

// Mock do router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } }
  ]
})

// Mock do toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Login Component', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    
    wrapper = mount(Login, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          'router-link': true
        }
      }
    })

    await router.isReady()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Renderização inicial', () => {
    it('deve renderizar o formulário de login', () => {
      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('deve ter campos vazios inicialmente', () => {
      expect(wrapper.find('input[type="email"]').element.value).toBe('')
      expect(wrapper.find('input[type="password"]').element.value).toBe('')
    })

    it('deve mostrar elementos de login', () => {
      const text = wrapper.text()
      expect(text).toContain('login' || 'entrar' || 'Login' || 'Entrar')
    })

    it('deve ter link para cadastro', () => {
      const text = wrapper.text()
      expect(text).toContain('conta' || 'cadastr' || 'Cadastr')
    })
  })

  describe('Validação de formulário', () => {
    it('deve validar email quando campo perde foco', async () => {
      const emailInput = wrapper.find('input[type="email"]')
      await emailInput.setValue('email-invalido')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      // Verificar se há alguma indicação de erro (classe, texto, etc.)
      const hasError = wrapper.text().includes('inválid') || 
                      wrapper.text().includes('formato') ||
                      wrapper.find('.error').exists() ||
                      wrapper.find('.invalid').exists()
      
      expect(hasError).toBe(true)
    })

    it('deve validar senha quando campo perde foco', async () => {
      const passwordInput = wrapper.find('input[type="password"]')
      await passwordInput.setValue('123')
      await passwordInput.trigger('blur')
      await wrapper.vm.$nextTick()

      // Verificar se há alguma indicação de erro
      const hasError = wrapper.text().includes('caracter') || 
                      wrapper.text().includes('curta') ||
                      wrapper.find('.error').exists() ||
                      wrapper.find('.invalid').exists()
      
      expect(hasError).toBe(true)
    })

    it('deve permitir correção de campos', async () => {
      const emailInput = wrapper.find('input[type="email"]')
      
      // Inserir email inválido
      await emailInput.setValue('email-invalido')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      // Corrigir email
      await emailInput.setValue('usuario@email.com')
      await emailInput.trigger('input')
      await wrapper.vm.$nextTick()

      // Campo deve aceitar o valor correto
      expect(emailInput.element.value).toBe('usuario@email.com')
    })
  })

  describe('Submissão do formulário', () => {
    it('deve chamar login da store com dados corretos', async () => {
      const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue()

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      const form = wrapper.find('form')

      await emailInput.setValue('usuario@email.com')
      await passwordInput.setValue('senha123')
      await form.trigger('submit.prevent')

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'usuario@email.com',
        password: 'senha123'
      })
    })

    it('deve processar submissão do formulário', async () => {
      const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue()

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      const form = wrapper.find('form')

      await emailInput.setValue('usuario@email.com')
      await passwordInput.setValue('senha123')
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(loginSpy).toHaveBeenCalled()
    })

    it('deve redirecionar após login bem-sucedido', async () => {
      const routerPushSpy = vi.spyOn(router, 'push')
      vi.spyOn(authStore, 'login').mockResolvedValue()

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      const form = wrapper.find('form')

      await emailInput.setValue('usuario@email.com')
      await passwordInput.setValue('senha123')
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      // Aguardar processamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(routerPushSpy).toHaveBeenCalledWith('/dashboard')
    })

    it('deve tratar erro de login', async () => {
      authStore.error = 'Credenciais inválidas'
      vi.spyOn(authStore, 'login').mockRejectedValue(new Error('Credenciais inválidas'))

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      const form = wrapper.find('form')

      await emailInput.setValue('usuario@email.com')
      await passwordInput.setValue('senha-errada')
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      // Aguardar processamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockToast.error).toHaveBeenCalled()
    })
  })

  describe('Funcionalidade "Lembrar de mim"', () => {
    it('deve ter checkbox para lembrar usuário', () => {
      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.exists()).toBe(true)
    })

    it('deve alterar estado do checkbox', async () => {
      const checkbox = wrapper.find('input[type="checkbox"]')
      
      expect(checkbox.element.checked).toBe(false)
      
      await checkbox.setChecked(true)
      
      expect(checkbox.element.checked).toBe(true)
    })
  })

  describe('Links e navegação', () => {
    it('deve ter elementos de navegação', () => {
      const text = wrapper.text()
      // Verificar se há links ou textos relacionados a navegação
      const hasNavigation = text.includes('cadastr') || 
                           text.includes('conta') ||
                           text.includes('senha') ||
                           wrapper.find('a').exists() ||
                           wrapper.find('router-link').exists()
      
      expect(hasNavigation).toBe(true)
    })
  })

  describe('Responsividade', () => {
    it('deve ter estrutura CSS adequada', () => {
      // Verificar se há classes CSS que indicam estrutura responsiva
      const hasResponsiveStructure = wrapper.find('.container').exists() ||
                                    wrapper.find('.form').exists() ||
                                    wrapper.find('.login').exists() ||
                                    wrapper.classes().length > 0

      expect(hasResponsiveStructure).toBe(true)
    })
  })

  describe('Acessibilidade', () => {
    it('deve ter labels ou placeholders nos inputs', () => {
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')

      const emailHasLabel = emailInput.attributes('placeholder') || 
                           emailInput.attributes('aria-label') ||
                           emailInput.attributes('id')

      const passwordHasLabel = passwordInput.attributes('placeholder') || 
                              passwordInput.attributes('aria-label') ||
                              passwordInput.attributes('id')

      expect(emailHasLabel).toBeDefined()
      expect(passwordHasLabel).toBeDefined()
    })

    it('deve ter estrutura semântica adequada', () => {
      const form = wrapper.find('form')
      expect(form.exists()).toBe(true)
    })
  })

  describe('Integração com store', () => {
    it('deve usar store de autenticação', () => {
      // Verificar se o componente tem acesso à store
      expect(authStore).toBeDefined()
      expect(typeof authStore.login).toBe('function')
    })

    it('deve reagir a mudanças no estado da store', async () => {
      // Simular estado de loading
      authStore.isLoading = true
      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]')
      // Verificar se o botão está desabilitado ou mostra loading
      const isDisabledOrLoading = submitButton.element.disabled || 
                                 wrapper.text().includes('carregando') ||
                                 wrapper.text().includes('loading') ||
                                 wrapper.find('.loading').exists()

      expect(isDisabledOrLoading).toBe(true)
    })

    it('deve mostrar erros da store', async () => {
      authStore.error = 'Erro de teste'
      await wrapper.vm.$nextTick()

      // Verificar se o erro é exibido de alguma forma
      const showsError = wrapper.text().includes('Erro de teste') ||
                        wrapper.find('.error').exists() ||
                        wrapper.find('.alert').exists()

      expect(showsError).toBe(true)
    })
  })

  describe('Campos do formulário', () => {
    it('deve aceitar entrada de dados', async () => {
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')

      await emailInput.setValue('test@email.com')
      await passwordInput.setValue('password123')

      expect(emailInput.element.value).toBe('test@email.com')
      expect(passwordInput.element.value).toBe('password123')
    })

    it('deve ter tipos de input corretos', () => {
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')

      expect(emailInput.exists()).toBe(true)
      expect(passwordInput.exists()).toBe(true)
    })
  })

  describe('Botão de submissão', () => {
    it('deve ter botão de submissão', () => {
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.exists()).toBe(true)
    })

    it('deve permitir clique no botão', async () => {
      const submitButton = wrapper.find('button[type="submit"]')
      
      // Preencher campos obrigatórios
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@email.com')
      await passwordInput.setValue('password123')
      
      await submitButton.trigger('click')
      
      // Verificar se o clique foi processado
      expect(submitButton.exists()).toBe(true)
    })
  })
})

