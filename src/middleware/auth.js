import { useAuthStore } from '@/stores/auth'

// Middleware para rotas que requerem autenticação
export const requireAuth = async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Inicializar store se necessário
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }
  
  // Verificar se usuário está autenticado
  if (!authStore.isAuthenticated) {
    // Redirecionar para login, salvando a rota de destino
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  next()
}

// Middleware para rotas que requerem usuário não autenticado (login, cadastro)
export const requireGuest = async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Inicializar store se necessário
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }
  
  // Se usuário já está autenticado, redirecionar para dashboard
  if (authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }
  
  next()
}

// Middleware para verificar permissões específicas
export const requirePermission = (permission) => {
  return async (to, from, next) => {
    const authStore = useAuthStore()
    
    // Verificar autenticação primeiro
    if (!authStore.isAuthenticated) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // Verificar se usuário tem a permissão necessária
    const userPermissions = authStore.user?.permissions || []
    if (!userPermissions.includes(permission)) {
      next({
        name: 'Forbidden',
        params: { requiredPermission: permission }
      })
      return
    }
    
    next()
  }
}

// Middleware para verificar se email foi verificado
export const requireEmailVerified = async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Verificar autenticação primeiro
  if (!authStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // Verificar se email foi verificado
  if (!authStore.user?.emailVerified) {
    next({
      name: 'EmailVerification',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  next()
}

// Middleware para verificar se perfil está completo
export const requireCompleteProfile = async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Verificar autenticação primeiro
  if (!authStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // Verificar se perfil está completo
  const user = authStore.user
  const requiredFields = ['name', 'email', 'phone']
  const isProfileComplete = requiredFields.every(field => user?.[field])
  
  if (!isProfileComplete) {
    next({
      name: 'ProfileSetup',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  next()
}

// Middleware para verificar se usuário tem corretoras conectadas
export const requireBrokerConnection = async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Verificar autenticação primeiro
  if (!authStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // Verificar se tem corretoras conectadas
  // Isso seria verificado via API ou store de corretoras
  // Por enquanto, vamos assumir que está ok
  next()
}

// Middleware para logs de navegação
export const logNavigation = (to, from, next) => {
  if (import.meta.env.DEV) {
    console.log(`🧭 Navegando de ${from.name || from.path} para ${to.name || to.path}`)
  }
  next()
}

// Middleware para verificar manutenção
export const checkMaintenance = (to, from, next) => {
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'
  
  if (isMaintenanceMode && to.name !== 'Maintenance') {
    next({ name: 'Maintenance' })
    return
  }
  
  next()
}

// Middleware combinado para aplicar múltiplos middlewares
export const applyMiddlewares = (middlewares) => {
  return async (to, from, next) => {
    let index = 0
    
    const runMiddleware = async () => {
      if (index >= middlewares.length) {
        next()
        return
      }
      
      const middleware = middlewares[index++]
      
      await middleware(to, from, (result) => {
        if (result === undefined) {
          runMiddleware()
        } else {
          next(result)
        }
      })
    }
    
    await runMiddleware()
  }
}

