<template>
  <div class="cadastro-container">
    <div class="cadastro-card">
      <div class="cadastro-header">
        <h1 class="cadastro-title">Crie sua conta gratuita</h1>
        <p class="cadastro-subtitle">Comece a investir com inteligência artificial</p>
      </div>

      <form @submit.prevent="handleRegister" class="cadastro-form">
        <div class="form-row">
          <div class="form-group">
            <label for="name" class="form-label">Nome completo</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="form-input"
              :class="{ 'error': errors.name }"
              placeholder="Seu nome completo"
              required
              autocomplete="name"
            />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>
        </div>

        <div class="form-row">
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
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="phone" class="form-label">Telefone (opcional)</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="form-input"
              :class="{ 'error': errors.phone }"
              placeholder="(11) 99999-9999"
              autocomplete="tel"
            />
            <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="password" class="form-label">Senha</label>
            <div class="password-input-container">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ 'error': errors.password }"
                placeholder="Mínimo 8 caracteres"
                required
                autocomplete="new-password"
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
            <div class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :class="passwordStrength.class"
                  :style="{ width: `${passwordStrength.percentage}%` }"
                ></div>
              </div>
              <span class="strength-text">{{ passwordStrength.text }}</span>
            </div>
            <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirmar senha</label>
            <div class="password-input-container">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ 'error': errors.confirmPassword }"
                placeholder="Digite a senha novamente"
                required
                autocomplete="new-password"
              />
              <button
                type="button"
                @click="toggleConfirmPassword"
                class="password-toggle"
                :aria-label="showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'"
              >
                {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-container">
            <input
              v-model="form.acceptTerms"
              type="checkbox"
              class="checkbox"
              required
            />
            <span class="checkmark"></span>
            Aceito os 
            <router-link to="/termos" target="_blank" class="link">
              Termos de Uso
            </router-link>
            e a
            <router-link to="/privacidade" target="_blank" class="link">
              Política de Privacidade
            </router-link>
          </label>
        </div>

        <div class="form-options">
          <label class="checkbox-container">
            <input
              v-model="form.acceptMarketing"
              type="checkbox"
              class="checkbox"
            />
            <span class="checkmark"></span>
            Desejo receber novidades e dicas de investimento por email
          </label>
        </div>

        <button
          type="submit"
          class="cadastro-button"
          :disabled="isLoading || !isFormValid"
          :class="{ 'loading': isLoading }"
        >
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Criando conta...' : 'Criar conta gratuita' }}
        </button>

        <div v-if="error" class="error-alert">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
      </form>

      <div class="cadastro-footer">
        <p class="login-link">
          Já tem uma conta?
          <router-link to="/login" class="login-button">
            Faça login
          </router-link>
        </p>
      </div>

      <!-- OAuth Registration Options -->
      <div class="oauth-section">
        <div class="oauth-divider">
          <span>ou cadastre-se com</span>
        </div>
        
        <div class="oauth-buttons">
          <button
            @click="registerWithGoogle"
            class="oauth-button google"
            :disabled="isLoading"
          >
            <span class="oauth-icon">🔍</span>
            Google
          </button>
          
          <button
            @click="registerWithGitHub"
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  acceptMarketing: false
})

const errors = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Computed
const isLoading = computed(() => authStore.isLoading)
const error = computed(() => authStore.error)

const isFormValid = computed(() => {
  return form.value.name &&
         form.value.email &&
         form.value.password &&
         form.value.confirmPassword &&
         form.value.acceptTerms &&
         form.value.email.includes('@') &&
         form.value.password.length >= 8 &&
         form.value.password === form.value.confirmPassword
})

const passwordStrength = computed(() => {
  const password = form.value.password
  if (!password) return { percentage: 0, text: '', class: '' }
  
  let score = 0
  let feedback = []
  
  // Critérios de força da senha
  if (password.length >= 8) score += 20
  if (password.length >= 12) score += 10
  if (/[a-z]/.test(password)) score += 15
  if (/[A-Z]/.test(password)) score += 15
  if (/[0-9]/.test(password)) score += 15
  if (/[^A-Za-z0-9]/.test(password)) score += 25
  
  // Feedback
  if (password.length < 8) feedback.push('muito curta')
  if (!/[a-z]/.test(password)) feedback.push('adicione minúsculas')
  if (!/[A-Z]/.test(password)) feedback.push('adicione maiúsculas')
  if (!/[0-9]/.test(password)) feedback.push('adicione números')
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('adicione símbolos')
  
  let text = ''
  let className = ''
  
  if (score < 30) {
    text = 'Muito fraca'
    className = 'very-weak'
  } else if (score < 50) {
    text = 'Fraca'
    className = 'weak'
  } else if (score < 70) {
    text = 'Média'
    className = 'medium'
  } else if (score < 90) {
    text = 'Forte'
    className = 'strong'
  } else {
    text = 'Muito forte'
    className = 'very-strong'
  }
  
  return {
    percentage: Math.min(score, 100),
    text: feedback.length > 0 ? `${text} (${feedback.join(', ')})` : text,
    class: className
  }
})

// Methods
const validateForm = () => {
  errors.value = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  }
  
  let isValid = true

  // Validar nome
  if (!form.value.name.trim()) {
    errors.value.name = 'Nome é obrigatório'
    isValid = false
  } else if (form.value.name.trim().length < 2) {
    errors.value.name = 'Nome deve ter pelo menos 2 caracteres'
    isValid = false
  }

  // Validar email
  if (!form.value.email) {
    errors.value.email = 'Email é obrigatório'
    isValid = false
  } else if (!form.value.email.includes('@')) {
    errors.value.email = 'Email deve ser válido'
    isValid = false
  }

  // Validar telefone (opcional)
  if (form.value.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(form.value.phone)) {
    errors.value.phone = 'Formato: (11) 99999-9999'
    isValid = false
  }

  // Validar senha
  if (!form.value.password) {
    errors.value.password = 'Senha é obrigatória'
    isValid = false
  } else if (form.value.password.length < 8) {
    errors.value.password = 'Senha deve ter pelo menos 8 caracteres'
    isValid = false
  }

  // Validar confirmação de senha
  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = 'Confirmação de senha é obrigatória'
    isValid = false
  } else if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Senhas não coincidem'
    isValid = false
  }

  return isValid
}

const handleRegister = async () => {
  // Limpar erro anterior
  authStore.clearError()
  
  // Validar formulário
  if (!validateForm()) {
    return
  }

  try {
    const result = await authStore.register({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim(),
      password: form.value.password,
      confirmPassword: form.value.confirmPassword,
      acceptTerms: form.value.acceptTerms,
      acceptMarketing: form.value.acceptMarketing
    })

    if (result.success) {
      toast.success('Conta criada com sucesso! Bem-vindo!')
      router.push('/dashboard')
    } else {
      toast.error(result.error || 'Erro ao criar conta')
    }
  } catch (err) {
    console.error('Erro no cadastro:', err)
    toast.error('Erro inesperado ao criar conta')
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const registerWithGoogle = async () => {
  try {
    toast.info('Cadastro com Google em desenvolvimento')
    // window.location.href = '/api/auth/google'
  } catch (err) {
    console.error('Erro no cadastro com Google:', err)
    toast.error('Erro no cadastro com Google')
  }
}

const registerWithGitHub = async () => {
  try {
    toast.info('Cadastro com GitHub em desenvolvimento')
    // window.location.href = '/api/auth/github'
  } catch (err) {
    console.error('Erro no cadastro com GitHub:', err)
    toast.error('Erro no cadastro com GitHub')
  }
}

// Formatação automática do telefone
watch(() => form.value.phone, (newPhone) => {
  if (newPhone) {
    // Remove tudo que não é número
    let cleaned = newPhone.replace(/\D/g, '')
    
    // Aplica máscara
    if (cleaned.length <= 11) {
      if (cleaned.length <= 2) {
        form.value.phone = cleaned
      } else if (cleaned.length <= 6) {
        form.value.phone = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
      } else if (cleaned.length <= 10) {
        form.value.phone = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
      } else {
        form.value.phone = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
      }
    }
  }
})
</script>

<style scoped>
.cadastro-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.cadastro-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.cadastro-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.cadastro-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.cadastro-subtitle {
  color: #718096;
  font-size: 1rem;
}

.cadastro-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
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

.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s;
  border-radius: 2px;
}

.strength-fill.very-weak { background: #e53e3e; }
.strength-fill.weak { background: #ff8c00; }
.strength-fill.medium { background: #ffd700; }
.strength-fill.strong { background: #32cd32; }
.strength-fill.very-strong { background: #228b22; }

.strength-text {
  font-size: 0.8rem;
  color: #718096;
}

.error-message {
  color: #e53e3e;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-options {
  margin: 0.5rem 0;
}

.checkbox-container {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4a5568;
  line-height: 1.4;
}

.checkbox {
  margin-right: 0.5rem;
  margin-top: 0.1rem;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  margin: 0 0.25rem;
}

.link:hover {
  text-decoration: underline;
}

.cadastro-button {
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

.cadastro-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.cadastro-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cadastro-button.loading {
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

.cadastro-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.login-link {
  color: #718096;
  font-size: 0.9rem;
}

.login-button {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
  transition: color 0.2s;
}

.login-button:hover {
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

@media (max-width: 600px) {
  .cadastro-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
  
  .cadastro-title {
    font-size: 1.75rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .oauth-buttons {
    flex-direction: column;
  }
}
</style>

