import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import Login from '@/components/Login.vue'
import Dashboard from '@/components/Dashboard.vue'
import { useAuthStore } from '@/stores/auth'

// Mock das APIs
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn()
}))

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

// Configuração do router para testes E2E
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Login },
    { path: '/login', name: 'login', component: Login },
    { path: '/dashboard', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/portfolio', name: 'portfolio', component: { template: '<div>Portfolio</div>' }, meta: { requiresAuth: true } }
  ]
})

describe('Login Flow E2E Tests', () => {
  let wrapper
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    
    wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          'router-view': false
        }
      }
    })

    await router.isReady()
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Fluxo completo de login', () => {
    it('deve completar fluxo de login com sucesso', async () => {
      // 1. Usuário acessa a página inicial (deve mostrar login)
      await router.push('/')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Entrar na sua conta')

      // 2. Usuário preenche credenciais
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('usuario@email.com')
      await passwordInput.setValue('senha123')

      // 3. Mock da resposta de login bem-sucedida
      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'usuario@email.com'
      }

      const { login } = await import('@/api/auth')
      login.mockResolvedValue({
        user: mockUser,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh'
      })

      // 4. Usuário submete o formulário
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      // 5. Aguardar processamento
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // 6. Verificar se foi redirecionado para dashboard
      expect(router.currentRoute.value.name).toBe('dashboard')
      expect(mockToast.success).toHaveBeenCalledWith('Login realizado com sucesso!')

      // 7. Verificar se usuário está autenticado
      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.user).toEqual(mockUser)
    })

    it('deve mostrar erro para credenciais inválidas', async () => {
      await router.push('/login')
      await wrapper.vm.$nextTick()

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('usuario@email.com')
      await passwordInput.setValue('senha-errada')

      // Mock de erro de login
      const { login } = await import('@/api/auth')
      login.mockRejectedValue(new Error('Credenciais inválidas'))

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Deve permanecer na página de login
      expect(router.currentRoute.value.name).toBe('login')
      expect(mockToast.error).toHaveBeenCalledWith('Credenciais inválidas')
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('deve validar campos obrigatórios', async () => {
      await router.push('/login')
      await wrapper.vm.$nextTick()

      // Tentar submeter formulário vazio
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      // Não deve chamar API de login
      const { login } = await import('@/api/auth')
      expect(login).not.toHaveBeenCalled()

      // Deve mostrar erros de validação
      expect(wrapper.text()).toContain('Email é obrigatório')
      expect(wrapper.text()).toContain('Senha é obrigatória')
    })
  })

  describe('Proteção de rotas', () => {
    it('deve redirecionar usuário não autenticado para login', async () => {
      // Tentar acessar rota protegida sem estar autenticado
      await router.push('/dashboard')
      await wrapper.vm.$nextTick()

      // Deve ser redirecionado para login
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('deve permitir acesso a rotas protegidas quando autenticado', async () => {
      // Simular usuário autenticado
      authStore.user = { id: 1, name: 'João Silva' }

      await router.push('/dashboard')
      await wrapper.vm.$nextTick()

      // Deve permanecer no dashboard
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('deve redirecionar usuário autenticado da página de login', async () => {
      // Simular usuário já autenticado
      authStore.user = { id: 1, name: 'João Silva' }

      await router.push('/login')
      await wrapper.vm.$nextTick()

      // Deve ser redirecionado para dashboard
      expect(router.currentRoute.value.name).toBe('dashboard')
    })
  })

  describe('Fluxo de logout', () => {
    it('deve completar fluxo de logout com sucesso', async () => {
      // 1. Simular usuário autenticado
      authStore.user = { id: 1, name: 'João Silva' }
      await router.push('/dashboard')
      await wrapper.vm.$nextTick()

      // 2. Mock da API de logout
      const { logout } = await import('@/api/auth')
      logout.mockResolvedValue()

      // 3. Encontrar e clicar no botão de logout
      const logoutButton = wrapper.find('[data-testid="logout-button"]')
      if (logoutButton.exists()) {
        await logoutButton.trigger('click')
      } else {
        // Simular logout programático
        await authStore.logout()
      }

      await wrapper.vm.$nextTick()

      // 4. Verificar se foi redirecionado para login
      expect(router.currentRoute.value.name).toBe('login')
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.user).toBeNull()
    })
  })

  describe('Persistência de sessão', () => {
    it('deve manter usuário logado após refresh da página', async () => {
      // Mock da API getCurrentUser
      const { getCurrentUser } = await import('@/api/auth')
      getCurrentUser.mockResolvedValue({
        id: 1,
        name: 'João Silva',
        email: 'usuario@email.com'
      })

      // Simular carregamento inicial da aplicação
      await authStore.getCurrentUser()
      await wrapper.vm.$nextTick()

      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.user.name).toBe('João Silva')
    })

    it('deve fazer logout quando token é inválido', async () => {
      // Mock de erro de token inválido
      const { getCurrentUser } = await import('@/api/auth')
      getCurrentUser.mockRejectedValue(new Error('Token inválido'))

      await authStore.getCurrentUser()
      await wrapper.vm.$nextTick()

      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.user).toBeNull()
    })
  })

  describe('Renovação automática de token', () => {
    it('deve renovar token automaticamente quando necessário', async () => {
      // Simular usuário autenticado
      authStore.user = { id: 1, name: 'João Silva' }

      // Mock da renovação de token
      const { refreshToken } = await import('@/api/auth')
      refreshToken.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token'
      })

      // Simular renovação de token
      const result = await authStore.refreshToken()

      expect(result).toBe(true)
      expect(refreshToken).toHaveBeenCalled()
    })

    it('deve fazer logout quando renovação de token falha', async () => {
      // Simular usuário autenticado
      authStore.user = { id: 1, name: 'João Silva' }

      // Mock de erro na renovação
      const { refreshToken } = await import('@/api/auth')
      refreshToken.mockRejectedValue(new Error('Refresh token expirado'))

      const result = await authStore.refreshToken()

      expect(result).toBe(false)
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.user).toBeNull()
    })
  })

  describe('Experiência do usuário', () => {
    it('deve mostrar indicadores de loading durante operações', async () => {
      await router.push('/login')
      await wrapper.vm.$nextTick()

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('usuario@email.com')
      await passwordInput.setValue('senha123')

      // Mock de login com delay
      const { login } = await import('@/api/auth')
      login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      const form = wrapper.find('form')
      const submitPromise = form.trigger('submit.prevent')

      // Verificar loading state
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Entrando...')

      await submitPromise
    })

    it('deve limpar erros quando usuário corrige dados', async () => {
      await router.push('/login')
      await wrapper.vm.$nextTick()

      // Simular erro
      authStore.error = 'Credenciais inválidas'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Credenciais inválidas')

      // Usuário começa a digitar novamente
      const emailInput = wrapper.find('input[type="email"]')
      await emailInput.setValue('novo@email.com')

      // Erro deve ser limpo
      expect(authStore.error).toBeNull()
    })

    it('deve manter dados do formulário durante validação', async () => {
      await router.push('/login')
      await wrapper.vm.$nextTick()

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('usuario@email.com')
      await passwordInput.setValue('senha123')

      // Simular erro de validação
      await emailInput.setValue('email-invalido')
      await emailInput.trigger('blur')

      // Senha deve permanecer preenchida
      expect(passwordInput.element.value).toBe('senha123')
    })
  })

  describe('Acessibilidade', () => {
    it('deve ter foco adequado nos elementos', async () => {
      await router.push('/login')
      await wrapper.vm.$nextTick()

      const emailInput = wrapper.find('input[type="email"]')
      
      // Simular foco no primeiro campo
      await emailInput.trigger('focus')
      
      expect(document.activeElement).toBe(emailInput.element)
    })

    it('deve ter navegação por teclado funcional', async () => {
      await router.push('/login')
      await wrapper.vm.$nextTick()

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      // Simular navegação por Tab
      await emailInput.trigger('focus')
      await emailInput.trigger('keydown', { key: 'Tab' })
      
      // Próximo elemento deve receber foco
      expect(document.activeElement).toBe(passwordInput.element)
    })
  })
})

