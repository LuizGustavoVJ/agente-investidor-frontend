<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">Bem-vindo de volta</h1>
        <p class="login-subtitle">Faça login para acessar sua conta</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            :class="{ 'error': errors.email }"
            placeholder="seu@email.com"
            required
            autocomplete="email"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Senha</label>
          <div class="password-input-container">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ 'error': errors.password }"
              placeholder="Sua senha"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              @click="togglePassword"
              class="password-toggle"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div class="form-options">
          <label class="checkbox-container">
            <input
              v-model="form.rememberMe"
              type="checkbox"
              class="checkbox"
            />
            <span class="checkmark"></span>
            Lembrar de mim
          </label>
          
          <router-link to="/recuperar-senha" class="forgot-password">
            Esqueceu a senha?
          </router-link>
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="isLoading || !isFormValid"
          :class="{ 'loading': isLoading }"
        >
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Entrando...' : 'Entrar' }}
        </button>

        <div v-if="error" class="error-alert">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
      </form>

      <div class="login-footer">
        <p class="signup-link">
          Não tem uma conta?
          <router-link to="/cadastro" class="signup-button">
            Cadastre-se gratuitamente
          </router-link>
        </p>
      </div>

      <!-- OAuth Login Options -->
      <div class="oauth-section">
        <div class="oauth-divider">
          <span>ou continue com</span>
        </div>
        
        <div class="oauth-buttons">
          <button
            @click="loginWithGoogle"
            class="oauth-button google"
            :disabled="isLoading"
          >
            <span class="oauth-icon">🔍</span>
            Google
          </button>
          
          <button
            @click="loginWithGitHub"
            class="oauth-button github"
            :disabled="isLoading"
          >
            <span class="oauth-icon">🐙</span>
            GitHub
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Composables
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// State
const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const errors = ref({
  email: '',
  password: ''
})

const showPassword = ref(false)

// Computed
const isLoading = computed(() => authStore.isLoading)
const error = computed(() => authStore.error)

const isFormValid = computed(() => {
  return form.value.email && 
         form.value.password && 
         form.value.email.includes('@') &&
         form.value.password.length >= 6
})

// Methods
const validateForm = () => {
  errors.value = { email: '', password: '' }
  let isValid = true

  // Validar email
  if (!form.value.email) {
    errors.value.email = 'Email é obrigatório'
    isValid = false
  } else if (!form.value.email.includes('@')) {
    errors.value.email = 'Email deve ser válido'
    isValid = false
  }

  // Validar senha
  if (!form.value.password) {
    errors.value.password = 'Senha é obrigatória'
    isValid = false
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Senha deve ter pelo menos 6 caracteres'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  // Limpar erro anterior
  authStore.clearError()
  
  // Validar formulário
  if (!validateForm()) {
    return
  }

  try {
    const result = await authStore.login({
      email: form.value.email,
      password: form.value.password,
      rememberMe: form.value.rememberMe
    })

    if (result.success) {
      toast.success('Login realizado com sucesso!')
      
      // Redirecionar para página de destino ou dashboard
      const redirectTo = route.query.redirect || '/dashboard'
      router.push(redirectTo)
    } else {
      toast.error(result.error || 'Erro no login')
    }
  } catch (err) {
    console.error('Erro no login:', err)
    toast.error('Erro inesperado no login')
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const loginWithGoogle = async () => {
  try {
    // Implementar login OAuth com Google
    toast.info('Login com Google em desenvolvimento')
    // window.location.href = '/api/auth/google'
  } catch (err) {
    console.error('Erro no login com Google:', err)
    toast.error('Erro no login com Google')
  }
}

const loginWithGitHub = async () => {
  try {
    // Implementar login OAuth com GitHub
    toast.info('Login com GitHub em desenvolvimento')
    // window.location.href = '/api/auth/github'
  } catch (err) {
    console.error('Erro no login com GitHub:', err)
    toast.error('Erro no login com GitHub')
  }
}

// Lifecycle
onMounted(() => {
  // Limpar erros ao montar componente
  authStore.clearError()
  
  // Pré-preencher email se vier da URL
  if (route.query.email) {
    form.value.email = route.query.email
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #718096;
  font-size: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f7fafc;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #e53e3e;
  background: #fed7d7;
}

.password-input-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #718096;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #667eea;
}

.error-message {
  color: #e53e3e;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.5rem 0;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4a5568;
}

.checkbox {
  margin-right: 0.5rem;
}

.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

.forgot-password:hover {
  color: #5a67d8;
  text-decoration: underline;
}

.login-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-button.loading {
  pointer-events: none;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-alert {
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  padding: 1rem;
  color: #c53030;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  font-size: 1.2rem;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.signup-link {
  color: #718096;
  font-size: 0.9rem;
}

.signup-button {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
  transition: color 0.2s;
}

.signup-button:hover {
  color: #5a67d8;
  text-decoration: underline;
}

.oauth-section {
  margin-top: 2rem;
}

.oauth-divider {
  text-align: center;
  position: relative;
  margin: 2rem 0;
}

.oauth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}

.oauth-divider span {
  background: white;
  padding: 0 1rem;
  color: #718096;
  font-size: 0.9rem;
}

.oauth-buttons {
  display: flex;
  gap: 1rem;
}

.oauth-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #4a5568;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.oauth-button:hover:not(:disabled) {
  border-color: #cbd5e0;
  background: #f7fafc;
}

.oauth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.oauth-icon {
  font-size: 1.2rem;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
  
  .login-title {
    font-size: 1.75rem;
  }
  
  .oauth-buttons {
    flex-direction: column;
  }
}
</style>

