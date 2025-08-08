<template>
  <div class="configuracoes-container">
    <div class="configuracoes-header">
      <div class="header-content">
        <h1 class="page-title">Configurações</h1>
        <p class="page-subtitle">Gerencie seu perfil, preferências e configurações da conta</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isInitialLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando configurações...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Erro ao carregar configurações</h3>
      <p>{{ errorMessage }}</p>
      <button @click="retryLoad" class="retry-button">Tentar novamente</button>
    </div>

    <!-- Configurações Content -->
    <div v-else class="configuracoes-content">
      <!-- Navegação das Seções -->
      <div class="config-navigation">
        <button 
          v-for="section in configSections" 
          :key="section.id"
          @click="activeSection = section.id"
          class="nav-btn"
          :class="{ 'active': activeSection === section.id }"
        >
          <span class="nav-icon">{{ section.icon }}</span>
          <span class="nav-label">{{ section.label }}</span>
        </button>
      </div>

      <!-- Seção: Perfil Pessoal -->
      <div v-if="activeSection === 'profile'" class="config-section">
        <div class="section-header">
          <h2>Perfil Pessoal</h2>
          <p>Informações básicas da sua conta</p>
        </div>

        <form @submit.prevent="saveProfile" class="config-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Nome</label>
              <input
                id="firstName"
                v-model="profileForm.firstName"
                type="text"
                class="form-input"
                :class="{ 'error': profileErrors.firstName }"
                placeholder="Seu nome"
              />
              <span v-if="profileErrors.firstName" class="error-message">
                {{ profileErrors.firstName }}
              </span>
            </div>

            <div class="form-group">
              <label for="lastName">Sobrenome</label>
              <input
                id="lastName"
                v-model="profileForm.lastName"
                type="text"
                class="form-input"
                :class="{ 'error': profileErrors.lastName }"
                placeholder="Seu sobrenome"
              />
              <span v-if="profileErrors.lastName" class="error-message">
                {{ profileErrors.lastName }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              class="form-input"
              :class="{ 'error': profileErrors.email }"
              placeholder="seu@email.com"
            />
            <span v-if="profileErrors.email" class="error-message">
              {{ profileErrors.email }}
            </span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="phone">Telefone</label>
              <input
                id="phone"
                v-model="profileForm.phone"
                type="tel"
                class="form-input"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div class="form-group">
              <label for="birthDate">Data de Nascimento</label>
              <input
                id="birthDate"
                v-model="profileForm.birthDate"
                type="date"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="bio">Biografia</label>
            <textarea
              id="bio"
              v-model="profileForm.bio"
              class="form-textarea"
              placeholder="Conte um pouco sobre você..."
              rows="4"
            ></textarea>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="save-btn"
              :disabled="isSavingProfile"
            >
              <span v-if="isSavingProfile" class="spinner"></span>
              {{ isSavingProfile ? 'Salvando...' : 'Salvar Perfil' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Seção: Perfil de Investidor -->
      <div v-if="activeSection === 'investor'" class="config-section">
        <div class="section-header">
          <h2>Perfil de Investidor</h2>
          <p>Configure suas preferências de investimento</p>
        </div>

        <form @submit.prevent="saveInvestorProfile" class="config-form">
          <div class="form-group">
            <label>Experiência em Investimentos</label>
            <div class="radio-group">
              <label 
                v-for="level in experienceLevels" 
                :key="level.value"
                class="radio-option"
              >
                <input
                  v-model="investorForm.experienceLevel"
                  type="radio"
                  :value="level.value"
                  class="radio-input"
                />
                <span class="radio-label">
                  <strong>{{ level.label }}</strong>
                  <span class="radio-description">{{ level.description }}</span>
                </span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Perfil de Risco</label>
            <div class="radio-group">
              <label 
                v-for="risk in riskProfiles" 
                :key="risk.value"
                class="radio-option"
              >
                <input
                  v-model="investorForm.riskProfile"
                  type="radio"
                  :value="risk.value"
                  class="radio-input"
                />
                <span class="radio-label">
                  <strong>{{ risk.label }}</strong>
                  <span class="radio-description">{{ risk.description }}</span>
                </span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="monthlyIncome">Renda Mensal</label>
              <select
                id="monthlyIncome"
                v-model="investorForm.monthlyIncome"
                class="form-select"
              >
                <option value="">Selecione...</option>
                <option value="up-to-3k">Até R$ 3.000</option>
                <option value="3k-to-10k">R$ 3.000 - R$ 10.000</option>
                <option value="10k-to-30k">R$ 10.000 - R$ 30.000</option>
                <option value="30k-plus">Acima de R$ 30.000</option>
              </select>
            </div>

            <div class="form-group">
              <label for="investmentGoal">Objetivo Principal</label>
              <select
                id="investmentGoal"
                v-model="investorForm.investmentGoal"
                class="form-select"
              >
                <option value="">Selecione...</option>
                <option value="emergency-fund">Reserva de Emergência</option>
                <option value="short-term">Objetivos de Curto Prazo</option>
                <option value="retirement">Aposentadoria</option>
                <option value="wealth-building">Construção de Patrimônio</option>
                <option value="passive-income">Renda Passiva</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="timeHorizon">Horizonte de Investimento</label>
              <select
                id="timeHorizon"
                v-model="investorForm.timeHorizon"
                class="form-select"
              >
                <option value="">Selecione...</option>
                <option value="short">Curto Prazo (até 2 anos)</option>
                <option value="medium">Médio Prazo (2-5 anos)</option>
                <option value="long">Longo Prazo (5+ anos)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="monthlyInvestment">Investimento Mensal</label>
              <input
                id="monthlyInvestment"
                v-model="investorForm.monthlyInvestment"
                type="number"
                class="form-input"
                placeholder="R$ 0,00"
                min="0"
                step="100"
              />
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="save-btn"
              :disabled="isSavingInvestor"
            >
              <span v-if="isSavingInvestor" class="spinner"></span>
              {{ isSavingInvestor ? 'Salvando...' : 'Salvar Perfil de Investidor' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Seção: Notificações -->
      <div v-if="activeSection === 'notifications'" class="config-section">
        <div class="section-header">
          <h2>Notificações</h2>
          <p>Configure como e quando você quer receber notificações</p>
        </div>

        <form @submit.prevent="saveNotifications" class="config-form">
          <div class="notification-group">
            <h3>Notificações por Email</h3>
            
            <div class="toggle-item">
              <div class="toggle-info">
                <strong>Relatórios Semanais</strong>
                <span>Resumo semanal do seu portfólio</span>
              </div>
              <label class="toggle-switch">
                <input 
                  v-model="notificationsForm.email.weeklyReports"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="toggle-item">
              <div class="toggle-info">
                <strong>Alertas de Mercado</strong>
                <span>Notificações sobre movimentos importantes</span>
              </div>
              <label class="toggle-switch">
                <input 
                  v-model="notificationsForm.email.marketAlerts"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="toggle-item">
              <div class="toggle-info">
                <strong>Recomendações IA</strong>
                <span>Novas recomendações das metodologias</span>
              </div>
              <label class="toggle-switch">
                <input 
                  v-model="notificationsForm.email.aiRecommendations"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="notification-group">
            <h3>Notificações Push</h3>
            
            <div class="toggle-item">
              <div class="toggle-info">
                <strong>Alertas Críticos</strong>
                <span>Notificações urgentes sobre seu portfólio</span>
              </div>
              <label class="toggle-switch">
                <input 
                  v-model="notificationsForm.push.criticalAlerts"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="toggle-item">
              <div class="toggle-info">
                <strong>Sincronização</strong>
                <span>Status das sincronizações com corretoras</span>
              </div>
              <label class="toggle-switch">
                <input 
                  v-model="notificationsForm.push.syncStatus"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="save-btn"
              :disabled="isSavingNotifications"
            >
              <span v-if="isSavingNotifications" class="spinner"></span>
              {{ isSavingNotifications ? 'Salvando...' : 'Salvar Notificações' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Seção: Segurança -->
      <div v-if="activeSection === 'security'" class="config-section">
        <div class="section-header">
          <h2>Segurança</h2>
          <p>Gerencie a segurança da sua conta</p>
        </div>

        <div class="security-sections">
          <!-- Alterar Senha -->
          <div class="security-card">
            <h3>Alterar Senha</h3>
            <p>Mantenha sua conta segura com uma senha forte</p>
            
            <form @submit.prevent="changePassword" class="security-form">
              <div class="form-group">
                <label for="currentPassword">Senha Atual</label>
                <input
                  id="currentPassword"
                  v-model="passwordForm.currentPassword"
                  type="password"
                  class="form-input"
                  :class="{ 'error': passwordErrors.currentPassword }"
                />
                <span v-if="passwordErrors.currentPassword" class="error-message">
                  {{ passwordErrors.currentPassword }}
                </span>
              </div>

              <div class="form-group">
                <label for="newPassword">Nova Senha</label>
                <input
                  id="newPassword"
                  v-model="passwordForm.newPassword"
                  type="password"
                  class="form-input"
                  :class="{ 'error': passwordErrors.newPassword }"
                />
                <div class="password-strength">
                  <div class="strength-bar">
                    <div 
                      class="strength-fill" 
                      :class="getPasswordStrengthClass()"
                      :style="{ width: `${getPasswordStrengthPercent()}%` }"
                    ></div>
                  </div>
                  <span class="strength-text">{{ getPasswordStrengthText() }}</span>
                </div>
                <span v-if="passwordErrors.newPassword" class="error-message">
                  {{ passwordErrors.newPassword }}
                </span>
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirmar Nova Senha</label>
                <input
                  id="confirmPassword"
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  class="form-input"
                  :class="{ 'error': passwordErrors.confirmPassword }"
                />
                <span v-if="passwordErrors.confirmPassword" class="error-message">
                  {{ passwordErrors.confirmPassword }}
                </span>
              </div>

              <button 
                type="submit" 
                class="security-btn"
                :disabled="isChangingPassword"
              >
                <span v-if="isChangingPassword" class="spinner"></span>
                {{ isChangingPassword ? 'Alterando...' : 'Alterar Senha' }}
              </button>
            </form>
          </div>

          <!-- Autenticação de Dois Fatores -->
          <div class="security-card">
            <h3>Autenticação de Dois Fatores (2FA)</h3>
            <p>Adicione uma camada extra de segurança à sua conta</p>
            
            <div v-if="!user.twoFactorEnabled" class="twofa-setup">
              <div class="twofa-info">
                <div class="info-icon">🔐</div>
                <div class="info-content">
                  <h4>2FA não configurado</h4>
                  <p>Configure a autenticação de dois fatores para maior segurança</p>
                </div>
              </div>
              <button @click="setup2FA" class="security-btn">
                Configurar 2FA
              </button>
            </div>

            <div v-else class="twofa-enabled">
              <div class="twofa-info">
                <div class="info-icon">✅</div>
                <div class="info-content">
                  <h4>2FA ativo</h4>
                  <p>Sua conta está protegida com autenticação de dois fatores</p>
                </div>
              </div>
              <button @click="disable2FA" class="security-btn danger">
                Desativar 2FA
              </button>
            </div>
          </div>

          <!-- Sessões Ativas -->
          <div class="security-card">
            <h3>Sessões Ativas</h3>
            <p>Gerencie os dispositivos conectados à sua conta</p>
            
            <div class="sessions-list">
              <div 
                v-for="session in activeSessions" 
                :key="session.id"
                class="session-item"
                :class="{ 'current': session.isCurrent }"
              >
                <div class="session-info">
                  <div class="session-device">
                    <span class="device-icon">{{ getDeviceIcon(session.device) }}</span>
                    <div class="device-details">
                      <strong>{{ session.device }}</strong>
                      <span class="session-location">{{ session.location }}</span>
                    </div>
                  </div>
                  <div class="session-meta">
                    <span class="session-time">{{ formatDate(session.lastActivity) }}</span>
                    <span v-if="session.isCurrent" class="current-badge">Atual</span>
                  </div>
                </div>
                <button 
                  v-if="!session.isCurrent"
                  @click="terminateSession(session)"
                  class="terminate-btn"
                >
                  Encerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção: Privacidade -->
      <div v-if="activeSection === 'privacy'" class="config-section">
        <div class="section-header">
          <h2>Privacidade</h2>
          <p>Controle como seus dados são utilizados</p>
        </div>

        <form @submit.prevent="savePrivacy" class="config-form">
          <div class="privacy-group">
            <h3>Coleta de Dados</h3>
            
            <div class="toggle-item">
              <div class="toggle-info">
                <strong>Análise de Uso</strong>
                <span>Permitir coleta de dados para melhorar o serviço</span>
              </div>
              <label class="toggle-switch">
                <input 
                  v-model="privacyForm.analytics"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="toggle-item">
              <div class="toggle-info">
                <strong>Personalização</strong>
                <span>Usar dados para personalizar recomendações</span>
              </div>
              <label class="toggle-switch">
                <input 
                  v-model="privacyForm.personalization"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="privacy-group">
            <h3>Compartilhamento</h3>
            
            <div class="toggle-item">
              <div class="toggle-info">
                <strong>Dados Agregados</strong>
                <span>Permitir uso de dados anonimizados para pesquisa</span>
              </div>
              <label class="toggle-switch">
                <input 
                  v-model="privacyForm.aggregatedData"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="save-btn"
              :disabled="isSavingPrivacy"
            >
              <span v-if="isSavingPrivacy" class="spinner"></span>
              {{ isSavingPrivacy ? 'Salvando...' : 'Salvar Privacidade' }}
            </button>
          </div>
        </form>

        <div class="data-export">
          <h3>Exportar Dados</h3>
          <p>Baixe uma cópia de todos os seus dados</p>
          <button @click="exportData" class="export-btn" :disabled="isExporting">
            <span v-if="isExporting" class="spinner"></span>
            {{ isExporting ? 'Exportando...' : 'Exportar Meus Dados' }}
          </button>
        </div>

        <div class="account-deletion">
          <h3>Excluir Conta</h3>
          <p>Esta ação é irreversível e excluirá permanentemente todos os seus dados</p>
          <button @click="showDeleteModal = true" class="delete-btn">
            Excluir Minha Conta
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Confirmar Exclusão da Conta</h3>
          <button @click="closeDeleteModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="warning-content">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">
              <h4>Esta ação é irreversível!</h4>
              <p>Ao excluir sua conta, você perderá:</p>
              <ul>
                <li>Todos os dados do seu portfólio</li>
                <li>Histórico de análises e recomendações</li>
                <li>Configurações e preferências</li>
                <li>Conexões com corretoras</li>
              </ul>
            </div>
          </div>
          
          <div class="confirmation-input">
            <label for="deleteConfirmation">
              Digite "EXCLUIR" para confirmar:
            </label>
            <input
              id="deleteConfirmation"
              v-model="deleteConfirmation"
              type="text"
              class="form-input"
              placeholder="EXCLUIR"
            />
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="modal-btn cancel-btn">
            Cancelar
          </button>
          <button 
            @click="deleteAccount" 
            class="modal-btn delete-btn"
            :disabled="deleteConfirmation !== 'EXCLUIR' || isDeletingAccount"
          >
            <span v-if="isDeletingAccount" class="spinner"></span>
            {{ isDeletingAccount ? 'Excluindo...' : 'Excluir Conta' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isInitialLoading = ref(true)
const activeSection = ref('profile')
const showDeleteModal = ref(false)
const deleteConfirmation = ref('')

// Form states
const isSavingProfile = ref(false)
const isSavingInvestor = ref(false)
const isSavingNotifications = ref(false)
const isSavingPrivacy = ref(false)
const isChangingPassword = ref(false)
const isExporting = ref(false)
const isDeletingAccount = ref(false)

// Form data
const profileForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  bio: ''
})

const investorForm = ref({
  experienceLevel: '',
  riskProfile: '',
  monthlyIncome: '',
  investmentGoal: '',
  timeHorizon: '',
  monthlyInvestment: 0
})

const notificationsForm = ref({
  email: {
    weeklyReports: true,
    marketAlerts: true,
    aiRecommendations: true
  },
  push: {
    criticalAlerts: true,
    syncStatus: true
  }
})

const privacyForm = ref({
  analytics: true,
  personalization: true,
  aggregatedData: false
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Form errors
const profileErrors = ref({})
const passwordErrors = ref({})

// Static data
const configSections = ref([
  { id: 'profile', label: 'Perfil Pessoal', icon: '👤' },
  { id: 'investor', label: 'Perfil de Investidor', icon: '📊' },
  { id: 'notifications', label: 'Notificações', icon: '🔔' },
  { id: 'security', label: 'Segurança', icon: '🔒' },
  { id: 'privacy', label: 'Privacidade', icon: '🛡️' }
])

const experienceLevels = ref([
  {
    value: 'beginner',
    label: 'Iniciante',
    description: 'Pouca ou nenhuma experiência com investimentos'
  },
  {
    value: 'intermediate',
    label: 'Intermediário',
    description: 'Alguma experiência, conhece conceitos básicos'
  },
  {
    value: 'advanced',
    label: 'Avançado',
    description: 'Experiência significativa e conhecimento técnico'
  },
  {
    value: 'expert',
    label: 'Especialista',
    description: 'Profissional ou investidor muito experiente'
  }
])

const riskProfiles = ref([
  {
    value: 'conservative',
    label: 'Conservador',
    description: 'Prefere segurança, aceita retornos menores'
  },
  {
    value: 'moderate',
    label: 'Moderado',
    description: 'Equilibra risco e retorno'
  },
  {
    value: 'aggressive',
    label: 'Agressivo',
    description: 'Aceita riscos maiores por retornos superiores'
  }
])

// Computed
const hasError = computed(() => !!authStore.error)
const errorMessage = computed(() => authStore.error || 'Erro desconhecido')
const user = computed(() => authStore.user || {})
const activeSessions = computed(() => authStore.activeSessions || [])

// Methods
const formatDate = (date) => {
  if (!date) return 'Nunca'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

const getDeviceIcon = (device) => {
  if (device.toLowerCase().includes('mobile')) return '📱'
  if (device.toLowerCase().includes('tablet')) return '📱'
  return '💻'
}

const getPasswordStrengthPercent = () => {
  const password = passwordForm.value.newPassword
  if (!password) return 0
  
  let score = 0
  if (password.length >= 8) score += 25
  if (/[a-z]/.test(password)) score += 25
  if (/[A-Z]/.test(password)) score += 25
  if (/[0-9]/.test(password)) score += 25
  
  return score
}

const getPasswordStrengthClass = () => {
  const percent = getPasswordStrengthPercent()
  if (percent <= 25) return 'weak'
  if (percent <= 50) return 'fair'
  if (percent <= 75) return 'good'
  return 'strong'
}

const getPasswordStrengthText = () => {
  const percent = getPasswordStrengthPercent()
  if (percent === 0) return ''
  if (percent <= 25) return 'Fraca'
  if (percent <= 50) return 'Regular'
  if (percent <= 75) return 'Boa'
  return 'Forte'
}

const validateProfile = () => {
  const errors = {}
  
  if (!profileForm.value.firstName.trim()) {
    errors.firstName = 'Nome é obrigatório'
  }
  
  if (!profileForm.value.lastName.trim()) {
    errors.lastName = 'Sobrenome é obrigatório'
  }
  
  if (!profileForm.value.email.trim()) {
    errors.email = 'Email é obrigatório'
  } else if (!/\S+@\S+\.\S+/.test(profileForm.value.email)) {
    errors.email = 'Email inválido'
  }
  
  profileErrors.value = errors
  return Object.keys(errors).length === 0
}

const validatePassword = () => {
  const errors = {}
  
  if (!passwordForm.value.currentPassword) {
    errors.currentPassword = 'Senha atual é obrigatória'
  }
  
  if (!passwordForm.value.newPassword) {
    errors.newPassword = 'Nova senha é obrigatória'
  } else if (passwordForm.value.newPassword.length < 8) {
    errors.newPassword = 'Nova senha deve ter pelo menos 8 caracteres'
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    errors.confirmPassword = 'Senhas não coincidem'
  }
  
  passwordErrors.value = errors
  return Object.keys(errors).length === 0
}

const saveProfile = async () => {
  if (!validateProfile()) return
  
  try {
    isSavingProfile.value = true
    await authStore.updateProfile(profileForm.value)
    toast.success('Perfil atualizado com sucesso!')
  } catch (error) {
    console.error('Erro ao salvar perfil:', error)
    toast.error('Erro ao salvar perfil')
  } finally {
    isSavingProfile.value = false
  }
}

const saveInvestorProfile = async () => {
  try {
    isSavingInvestor.value = true
    await authStore.updateInvestorProfile(investorForm.value)
    toast.success('Perfil de investidor atualizado!')
  } catch (error) {
    console.error('Erro ao salvar perfil de investidor:', error)
    toast.error('Erro ao salvar perfil de investidor')
  } finally {
    isSavingInvestor.value = false
  }
}

const saveNotifications = async () => {
  try {
    isSavingNotifications.value = true
    await authStore.updateNotificationSettings(notificationsForm.value)
    toast.success('Configurações de notificação salvas!')
  } catch (error) {
    console.error('Erro ao salvar notificações:', error)
    toast.error('Erro ao salvar configurações de notificação')
  } finally {
    isSavingNotifications.value = false
  }
}

const savePrivacy = async () => {
  try {
    isSavingPrivacy.value = true
    await authStore.updatePrivacySettings(privacyForm.value)
    toast.success('Configurações de privacidade salvas!')
  } catch (error) {
    console.error('Erro ao salvar privacidade:', error)
    toast.error('Erro ao salvar configurações de privacidade')
  } finally {
    isSavingPrivacy.value = false
  }
}

const changePassword = async () => {
  if (!validatePassword()) return
  
  try {
    isChangingPassword.value = true
    await authStore.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    )
    
    // Limpar formulário
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    toast.success('Senha alterada com sucesso!')
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    toast.error('Erro ao alterar senha')
  } finally {
    isChangingPassword.value = false
  }
}

const setup2FA = async () => {
  try {
    await authStore.setup2FA()
    toast.success('2FA configurado com sucesso!')
  } catch (error) {
    console.error('Erro ao configurar 2FA:', error)
    toast.error('Erro ao configurar 2FA')
  }
}

const disable2FA = async () => {
  if (!confirm('Tem certeza que deseja desativar a autenticação de dois fatores?')) return
  
  try {
    await authStore.disable2FA()
    toast.success('2FA desativado')
  } catch (error) {
    console.error('Erro ao desativar 2FA:', error)
    toast.error('Erro ao desativar 2FA')
  }
}

const terminateSession = async (session) => {
  try {
    await authStore.terminateSession(session.id)
    toast.success('Sessão encerrada')
  } catch (error) {
    console.error('Erro ao encerrar sessão:', error)
    toast.error('Erro ao encerrar sessão')
  }
}

const exportData = async () => {
  try {
    isExporting.value = true
    await authStore.exportUserData()
    toast.success('Dados exportados! Verifique seus downloads.')
  } catch (error) {
    console.error('Erro ao exportar dados:', error)
    toast.error('Erro ao exportar dados')
  } finally {
    isExporting.value = false
  }
}

const deleteAccount = async () => {
  try {
    isDeletingAccount.value = true
    await authStore.deleteAccount()
    toast.success('Conta excluída com sucesso')
    router.push('/')
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    toast.error('Erro ao excluir conta')
  } finally {
    isDeletingAccount.value = false
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteConfirmation.value = ''
}

const retryLoad = async () => {
  isInitialLoading.value = true
  await loadUserData()
}

const loadUserData = async () => {
  try {
    isInitialLoading.value = true
    await authStore.loadUserSettings()
    
    // Preencher formulários com dados do usuário
    const userData = authStore.user
    if (userData) {
      profileForm.value = {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        birthDate: userData.birthDate || '',
        bio: userData.bio || ''
      }
      
      if (userData.investorProfile) {
        investorForm.value = { ...userData.investorProfile }
      }
      
      if (userData.notificationSettings) {
        notificationsForm.value = { ...userData.notificationSettings }
      }
      
      if (userData.privacySettings) {
        privacyForm.value = { ...userData.privacySettings }
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error)
    toast.error('Erro ao carregar configurações')
  } finally {
    isInitialLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loadUserData()
})
</script>

<style scoped>
.configuracoes-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.configuracoes-header {
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.header-content p {
  color: #718096;
  font-size: 1.1rem;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #6c63ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.configuracoes-content {
  display: flex;
  gap: 2rem;
}

.config-navigation {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 250px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  background: white;
  color: #4a5568;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-btn:hover {
  background: #f7fafc;
  transform: translateY(-1px);
}

.nav-btn.active {
  background: #6c63ff;
  color: white;
  box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-label {
  font-weight: 600;
}

.config-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.section-header p {
  color: #718096;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #4a5568;
}

.form-input, .form-select, .form-textarea {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #6c63ff;
  box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
}

.form-input.error, .form-select.error, .form-textarea.error {
  border-color: #f44336;
}

.error-message {
  color: #f44336;
  font-size: 0.875rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  border-color: #cbd5e0;
}

.radio-option:has(.radio-input:checked) {
  border-color: #6c63ff;
  background: #f7faff;
}

.radio-input {
  margin-top: 0.25rem;
}

.radio-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.radio-description {
  color: #718096;
  font-size: 0.875rem;
}

.notification-group, .privacy-group {
  margin-bottom: 2rem;
}

.notification-group h3, .privacy-group h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 1rem;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toggle-info strong {
  color: #1a202c;
}

.toggle-info span {
  color: #718096;
  font-size: 0.875rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #6c63ff;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.save-btn, .security-btn, .export-btn, .delete-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: #6c63ff;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #5a52d5;
}

.security-btn {
  background: #00e676;
  color: white;
}

.security-btn:hover:not(:disabled) {
  background: #00c853;
}

.security-btn.danger {
  background: #f44336;
}

.security-btn.danger:hover:not(:disabled) {
  background: #d32f2f;
}

.export-btn {
  background: #ffc107;
  color: #1a202c;
}

.export-btn:hover:not(:disabled) {
  background: #ffb300;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #d32f2f;
}

.save-btn:disabled, .security-btn:disabled, .export-btn:disabled, .delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.security-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.security-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
}

.security-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.security-card p {
  color: #718096;
  margin-bottom: 1.5rem;
}

.security-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.strength-fill.weak { background: #f44336; }
.strength-fill.fair { background: #ff9800; }
.strength-fill.good { background: #ffc107; }
.strength-fill.strong { background: #4caf50; }

.strength-text {
  font-size: 0.875rem;
  font-weight: 600;
}

.twofa-setup, .twofa-enabled {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.twofa-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-icon {
  font-size: 2rem;
}

.info-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.info-content p {
  color: #718096;
  font-size: 0.875rem;
  margin: 0;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.session-item.current {
  border-color: #6c63ff;
  background: #f7faff;
}

.session-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 1rem;
}

.session-device {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.device-icon {
  font-size: 1.5rem;
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.device-details strong {
  color: #1a202c;
}

.session-location {
  color: #718096;
  font-size: 0.875rem;
}

.session-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.session-time {
  color: #718096;
  font-size: 0.875rem;
}

.current-badge {
  background: #6c63ff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.terminate-btn {
  background: #f44336;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.terminate-btn:hover {
  background: #d32f2f;
}

.data-export, .account-deletion {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.data-export h3, .account-deletion h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.data-export p, .account-deletion p {
  color: #718096;
  margin-bottom: 1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
  padding: 0.25rem;
}

.modal-close:hover {
  color: #1a202c;
}

.modal-body {
  padding: 1.5rem;
}

.warning-content {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.warning-icon {
  font-size: 2rem;
  color: #f44336;
}

.warning-text h4 {
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.warning-text p {
  color: #718096;
  margin-bottom: 1rem;
}

.warning-text ul {
  color: #718096;
  padding-left: 1.5rem;
}

.warning-text li {
  margin-bottom: 0.25rem;
}

.confirmation-input {
  margin-top: 1rem;
}

.confirmation-input label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.modal-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-btn {
  background: #e2e8f0;
  color: #4a5568;
}

.cancel-btn:hover {
  background: #cbd5e0;
}

.modal-btn.delete-btn {
  background: #f44336;
  color: white;
}

.modal-btn.delete-btn:hover:not(:disabled) {
  background: #d32f2f;
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .configuracoes-content {
    flex-direction: column;
  }
  
  .config-navigation {
    flex-direction: row;
    min-width: auto;
    overflow-x: auto;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  .nav-btn {
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .configuracoes-container {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .config-navigation {
    flex-wrap: wrap;
  }
  
  .nav-btn {
    min-width: auto;
    flex: 1;
  }
  
  .session-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .session-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .terminate-btn {
    align-self: flex-end;
  }
  
  .twofa-setup, .twofa-enabled {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>

