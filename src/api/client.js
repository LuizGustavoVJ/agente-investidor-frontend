import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Configuração base do cliente HTTP
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  withCredentials: true, // Importante: permite envio de cookies HTTP-only
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Interceptor de requisição
client.interceptors.request.use(
  (config) => {
    // Adicionar headers de segurança
    config.headers['X-Requested-With'] = 'XMLHttpRequest'
    
    // Log da requisição em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      })
    }
    
    return config
  },
  (error) => {
    console.error('❌ Erro na requisição:', error)
    return Promise.reject(error)
  }
)

// Interceptor de resposta
client.interceptors.response.use(
  (response) => {
    // Log da resposta em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      })
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Log do erro
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    })
    
    // Tratamento de erro 401 (Não autorizado)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Tentar renovar o token via cookie
        const refreshResponse = await client.post('/auth/refresh')
        
        if (refreshResponse.data.success) {
          // Token renovado com sucesso, tentar novamente a requisição original
          return client(originalRequest)
        }
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError)
      }
      
      // Se chegou aqui, o refresh falhou - fazer logout
      const authStore = useAuthStore()
      await authStore.logout()
      
      // Redirecionar para login se não estiver em páginas públicas
      const publicRoutes = ['/', '/login', '/cadastro', '/recuperar-senha']
      if (!publicRoutes.includes(window.location.pathname)) {
        window.location.href = '/login'
      }
    }
    
    // Tratamento de erro 403 (Proibido)
    if (error.response?.status === 403) {
      console.warn('Acesso negado:', error.response.data?.message)
    }
    
    // Tratamento de erro 500 (Erro interno do servidor)
    if (error.response?.status >= 500) {
      console.error('Erro interno do servidor:', error.response.data?.message)
      // Aqui você pode adicionar notificação para o usuário
    }
    
    return Promise.reject(error)
  }
)

// Função para configurar base URL dinamicamente
export const setBaseURL = (url) => {
  client.defaults.baseURL = url
}

// Função para adicionar headers customizados
export const setAuthHeader = (token) => {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete client.defaults.headers.common['Authorization']
  }
}

// Função para fazer upload de arquivos
export const uploadFile = async (url, file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return client.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress(percentCompleted)
      }
    }
  })
}

export default client

