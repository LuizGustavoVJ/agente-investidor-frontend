import { createRouter, createWebHistory } from 'vue-router'
import { 
  requireAuth, 
  requireGuest, 
  logNavigation, 
  checkMaintenance 
} from '@/middleware/auth'

// Importar componentes
import Home from '@/components/Home.vue'
import Login from '@/components/Login.vue'
import Cadastro from '@/components/Cadastro.vue'
import Dashboard from '@/components/Dashboard.vue'
import Error404 from '@/components/Error404.vue'
import Error500 from '@/components/Error500.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Agente Investidor - Inteligência Artificial para Investimentos',
      description: 'Plataforma de investimentos com IA avançada',
      public: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    beforeEnter: requireGuest,
    meta: {
      title: 'Login - Agente Investidor',
      description: 'Faça login na sua conta',
      public: true
    }
  },
  {
    path: '/cadastro',
    name: 'Cadastro',
    component: Cadastro,
    beforeEnter: requireGuest,
    meta: {
      title: 'Cadastro - Agente Investidor',
      description: 'Crie sua conta gratuita',
      public: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    beforeEnter: requireAuth,
    meta: {
      title: 'Dashboard - Agente Investidor',
      description: 'Painel de controle dos seus investimentos',
      requiresAuth: true
    }
  },
  {
    path: '/portfolio',
    name: 'Portfolio',
    component: () => import('@/views/Portfolio.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: 'Portfólio - Agente Investidor',
      description: 'Visualize e gerencie seu portfólio',
      requiresAuth: true
    }
  },
  {
    path: '/analises',
    name: 'Analises',
    component: () => import('@/views/Analises.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: 'Análises IA - Agente Investidor',
      description: 'Análises inteligentes dos seus investimentos',
      requiresAuth: true
    }
  },
  {
    path: '/metodologias',
    name: 'Metodologias',
    component: () => import('@/views/Metodologias.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: 'Metodologias - Agente Investidor',
      description: 'Metodologias de investimento com IA',
      requiresAuth: true
    }
  },
  {
    path: '/corretoras',
    name: 'Corretoras',
    component: () => import('@/views/Corretoras.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: 'Corretoras - Agente Investidor',
      description: 'Conecte e gerencie suas corretoras',
      requiresAuth: true
    }
  },
  {
    path: '/relatorios',
    name: 'Relatorios',
    component: () => import('@/views/Relatorios.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: 'Relatórios - Agente Investidor',
      description: 'Relatórios detalhados dos seus investimentos',
      requiresAuth: true
    }
  },
  {
    path: '/configuracoes',
    name: 'Configuracoes',
    component: () => import('@/views/Configuracoes.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: 'Configurações - Agente Investidor',
      description: 'Configure sua conta e preferências',
      requiresAuth: true
    }
  },
  {
    path: '/perfil',
    name: 'Perfil',
    component: () => import('@/views/Perfil.vue'),
    beforeEnter: requireAuth,
    meta: {
      title: 'Perfil - Agente Investidor',
      description: 'Gerencie seu perfil de usuário',
      requiresAuth: true
    }
  },
  {
    path: '/ajuda',
    name: 'Ajuda',
    component: () => import('@/views/Ajuda.vue'),
    meta: {
      title: 'Ajuda - Agente Investidor',
      description: 'Central de ajuda e suporte',
      public: true
    }
  },
  {
    path: '/sobre',
    name: 'Sobre',
    component: () => import('@/views/Sobre.vue'),
    meta: {
      title: 'Sobre - Agente Investidor',
      description: 'Conheça mais sobre nossa plataforma',
      public: true
    }
  },
  {
    path: '/termos',
    name: 'Termos',
    component: () => import('@/views/Termos.vue'),
    meta: {
      title: 'Termos de Uso - Agente Investidor',
      description: 'Termos de uso da plataforma',
      public: true
    }
  },
  {
    path: '/privacidade',
    name: 'Privacidade',
    component: () => import('@/views/Privacidade.vue'),
    meta: {
      title: 'Política de Privacidade - Agente Investidor',
      description: 'Nossa política de privacidade',
      public: true
    }
  },
  {
    path: '/manutencao',
    name: 'Maintenance',
    component: () => import('@/views/Maintenance.vue'),
    meta: {
      title: 'Manutenção - Agente Investidor',
      description: 'Sistema em manutenção',
      public: true
    }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/Forbidden.vue'),
    meta: {
      title: 'Acesso Negado - Agente Investidor',
      description: 'Você não tem permissão para acessar esta página',
      public: true
    }
  },
  {
    path: '/500',
    name: 'Error500',
    component: Error500,
    meta: {
      title: 'Erro Interno - Agente Investidor',
      description: 'Erro interno do servidor',
      public: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'Error404',
    component: Error404,
    meta: {
      title: 'Página não encontrada - Agente Investidor',
      description: 'A página que você procura não foi encontrada',
      public: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Sempre rolar para o topo ao navegar para uma nova rota
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Middleware global - aplicado a todas as rotas
router.beforeEach(checkMaintenance)
router.beforeEach(logNavigation)

// Middleware para atualizar título da página
router.afterEach((to) => {
  // Atualizar título da página
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // Atualizar meta description
  if (to.meta.description) {
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', to.meta.description)
    }
  }
})

// Tratamento de erros de navegação
router.onError((error) => {
  console.error('Erro de navegação:', error)
  
  // Redirecionar para página de erro em caso de falha
  if (error.name === 'ChunkLoadError') {
    // Erro de carregamento de chunk - recarregar página
    window.location.reload()
  } else {
    // Outros erros - redirecionar para página de erro
    router.push('/500')
  }
})

export default router

