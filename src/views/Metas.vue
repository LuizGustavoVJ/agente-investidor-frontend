<template>
  <div class="metas-container">
    <div class="metas-header">
      <div class="header-content">
        <h1 class="page-title">Metas Financeiras</h1>
        <p class="page-subtitle">Defina e acompanhe seus objetivos de investimento</p>
      </div>
      
      <div class="header-actions">
        <button 
          @click="showCreateModal = true" 
          class="create-btn"
        >
          <span class="create-icon">🎯</span>
          Nova Meta
        </button>
        
        <button @click="exportGoals" class="export-btn">
          <span class="export-icon">📄</span>
          Exportar
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isInitialLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando suas metas...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Erro ao carregar metas</h3>
      <p>{{ errorMessage }}</p>
      <button @click="retryLoad" class="retry-button">Tentar novamente</button>
    </div>

    <!-- Metas Content -->
    <div v-else class="metas-content">
      <!-- Resumo das Metas -->
      <div class="goals-summary">
        <div class="summary-card">
          <div class="card-header">
            <h3>Total de Metas</h3>
            <span class="card-icon">🎯</span>
          </div>
          <div class="card-value">{{ totalGoals }}</div>
          <div class="card-info">{{ activeGoals }} ativas</div>
        </div>

        <div class="summary-card">
          <div class="card-header">
            <h3>Valor Total</h3>
            <span class="card-icon">💰</span>
          </div>
          <div class="card-value">{{ formatCurrency(totalTargetValue) }}</div>
          <div class="card-info">objetivo total</div>
        </div>

        <div class="summary-card">
          <div class="card-header">
            <h3>Progresso Médio</h3>
            <span class="card-icon">📊</span>
          </div>
          <div class="card-value">{{ averageProgress }}%</div>
          <div class="card-info">das metas ativas</div>
        </div>

        <div class="summary-card">
          <div class="card-header">
            <h3>Metas Concluídas</h3>
            <span class="card-icon">✅</span>
          </div>
          <div class="card-value">{{ completedGoals }}</div>
          <div class="card-info">este ano</div>
        </div>
      </div>

      <!-- Filtros e Busca -->
      <div class="goals-filters">
        <div class="filter-group">
          <div class="search-box">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Buscar meta..."
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
          
          <select v-model="selectedStatusFilter" class="filter-select">
            <option value="all">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="completed">Concluídas</option>
            <option value="paused">Pausadas</option>
            <option value="overdue">Atrasadas</option>
          </select>
          
          <select v-model="selectedCategoryFilter" class="filter-select">
            <option value="all">Todas as categorias</option>
            <option value="emergency">Reserva de Emergência</option>
            <option value="house">Casa Própria</option>
            <option value="car">Veículo</option>
            <option value="travel">Viagem</option>
            <option value="retirement">Aposentadoria</option>
            <option value="education">Educação</option>
            <option value="investment">Investimento</option>
            <option value="other">Outros</option>
          </select>
        </div>
        
        <div class="view-toggle">
          <button 
            @click="viewMode = 'grid'"
            class="view-btn"
            :class="{ 'active': viewMode === 'grid' }"
          >
            <span>⊞</span>
          </button>
          <button 
            @click="viewMode = 'list'"
            class="view-btn"
            :class="{ 'active': viewMode === 'list' }"
          >
            <span>☰</span>
          </button>
        </div>
      </div>

      <!-- Lista/Grid de Metas -->
      <div v-if="filteredGoals.length === 0" class="no-goals">
        <div class="no-goals-icon">🎯</div>
        <h3>Nenhuma meta encontrada</h3>
        <p>Crie sua primeira meta financeira para começar a acompanhar seus objetivos</p>
        <button @click="showCreateModal = true" class="create-first-btn">
          Criar Primeira Meta
        </button>
      </div>

      <div v-else class="goals-container" :class="viewMode">
        <div 
          v-for="goal in paginatedGoals" 
          :key="goal.id"
          class="goal-card"
          :class="[goal.status, { 'overdue': isOverdue(goal) }]"
        >
          <div class="goal-header">
            <div class="goal-info">
              <div class="goal-category">
                <span class="category-icon">{{ getCategoryIcon(goal.category) }}</span>
                <span class="category-name">{{ getCategoryName(goal.category) }}</span>
              </div>
              <h3 class="goal-title">{{ goal.title }}</h3>
              <p class="goal-description">{{ goal.description }}</p>
            </div>
            <div class="goal-status">
              <span class="status-badge" :class="goal.status">
                {{ getStatusText(goal.status) }}
              </span>
            </div>
          </div>

          <div class="goal-progress">
            <div class="progress-header">
              <span class="progress-label">Progresso</span>
              <span class="progress-percentage">{{ getProgressPercentage(goal) }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${getProgressPercentage(goal)}%` }"
                :class="getProgressClass(goal)"
              ></div>
            </div>
            <div class="progress-values">
              <span class="current-value">{{ formatCurrency(goal.currentValue) }}</span>
              <span class="target-value">{{ formatCurrency(goal.targetValue) }}</span>
            </div>
          </div>

          <div class="goal-timeline">
            <div class="timeline-item">
              <span class="timeline-label">Início</span>
              <span class="timeline-value">{{ formatDate(goal.startDate) }}</span>
            </div>
            <div class="timeline-item">
              <span class="timeline-label">Meta</span>
              <span class="timeline-value">{{ formatDate(goal.targetDate) }}</span>
            </div>
            <div class="timeline-item">
              <span class="timeline-label">Restam</span>
              <span class="timeline-value" :class="{ 'overdue': isOverdue(goal) }">
                {{ getTimeRemaining(goal) }}
              </span>
            </div>
          </div>

          <div v-if="goal.monthlyContribution > 0" class="goal-contribution">
            <div class="contribution-info">
              <span class="contribution-label">Aporte Mensal</span>
              <span class="contribution-value">{{ formatCurrency(goal.monthlyContribution) }}</span>
            </div>
            <div class="contribution-suggestion" v-if="getSuggestedContribution(goal) !== goal.monthlyContribution">
              <span class="suggestion-label">Sugerido</span>
              <span class="suggestion-value">{{ formatCurrency(getSuggestedContribution(goal)) }}</span>
            </div>
          </div>

          <div class="goal-actions">
            <button 
              @click="addContribution(goal)"
              class="action-btn contribute-btn"
              :disabled="goal.status === 'completed'"
            >
              <span class="btn-icon">💰</span>
              Aportar
            </button>
            
            <button 
              @click="viewGoalDetails(goal)"
              class="action-btn details-btn"
            >
              <span class="btn-icon">📊</span>
              Detalhes
            </button>
            
            <button 
              @click="editGoal(goal)"
              class="action-btn edit-btn"
            >
              <span class="btn-icon">✏️</span>
              Editar
            </button>
            
            <div class="action-dropdown">
              <button 
                @click="toggleDropdown(goal.id)"
                class="action-btn dropdown-btn"
              >
                <span class="btn-icon">⋮</span>
              </button>
              <div v-if="activeDropdown === goal.id" class="dropdown-menu">
                <button 
                  v-if="goal.status === 'active'"
                  @click="pauseGoal(goal)"
                  class="dropdown-item"
                >
                  ⏸️ Pausar
                </button>
                <button 
                  v-if="goal.status === 'paused'"
                  @click="resumeGoal(goal)"
                  class="dropdown-item"
                >
                  ▶️ Retomar
                </button>
                <button 
                  v-if="goal.status !== 'completed'"
                  @click="markAsCompleted(goal)"
                  class="dropdown-item"
                >
                  ✅ Marcar como Concluída
                </button>
                <button 
                  @click="duplicateGoal(goal)"
                  class="dropdown-item"
                >
                  📋 Duplicar
                </button>
                <button 
                  @click="deleteGoal(goal)"
                  class="dropdown-item danger"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginação -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = 1" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          ««
        </button>
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          «
        </button>
        
        <span class="page-info">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          »
        </button>
        <button 
          @click="currentPage = totalPages" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          »»
        </button>
      </div>
    </div>

    <!-- Modal para Criar/Editar Meta -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showEditModal ? 'Editar Meta' : 'Nova Meta Financeira' }}</h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveGoal" class="goal-form">
            <div class="form-row">
              <div class="form-group">
                <label for="goalTitle">Título da Meta</label>
                <input
                  id="goalTitle"
                  v-model="goalForm.title"
                  type="text"
                  class="form-input"
                  :class="{ 'error': goalErrors.title }"
                  placeholder="Ex: Casa própria, Viagem para Europa..."
                  required
                />
                <span v-if="goalErrors.title" class="error-message">
                  {{ goalErrors.title }}
                </span>
              </div>

              <div class="form-group">
                <label for="goalCategory">Categoria</label>
                <select
                  id="goalCategory"
                  v-model="goalForm.category"
                  class="form-select"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="emergency">Reserva de Emergência</option>
                  <option value="house">Casa Própria</option>
                  <option value="car">Veículo</option>
                  <option value="travel">Viagem</option>
                  <option value="retirement">Aposentadoria</option>
                  <option value="education">Educação</option>
                  <option value="investment">Investimento</option>
                  <option value="other">Outros</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="goalDescription">Descrição</label>
              <textarea
                id="goalDescription"
                v-model="goalForm.description"
                class="form-textarea"
                placeholder="Descreva sua meta em detalhes..."
                rows="3"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="targetValue">Valor Objetivo</label>
                <input
                  id="targetValue"
                  v-model="goalForm.targetValue"
                  type="number"
                  class="form-input"
                  :class="{ 'error': goalErrors.targetValue }"
                  placeholder="R$ 0,00"
                  min="0"
                  step="100"
                  required
                />
                <span v-if="goalErrors.targetValue" class="error-message">
                  {{ goalErrors.targetValue }}
                </span>
              </div>

              <div class="form-group">
                <label for="currentValue">Valor Atual</label>
                <input
                  id="currentValue"
                  v-model="goalForm.currentValue"
                  type="number"
                  class="form-input"
                  placeholder="R$ 0,00"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="targetDate">Data Objetivo</label>
                <input
                  id="targetDate"
                  v-model="goalForm.targetDate"
                  type="date"
                  class="form-input"
                  :class="{ 'error': goalErrors.targetDate }"
                  :min="today"
                  required
                />
                <span v-if="goalErrors.targetDate" class="error-message">
                  {{ goalErrors.targetDate }}
                </span>
              </div>

              <div class="form-group">
                <label for="monthlyContribution">Aporte Mensal</label>
                <input
                  id="monthlyContribution"
                  v-model="goalForm.monthlyContribution"
                  type="number"
                  class="form-input"
                  placeholder="R$ 0,00"
                  min="0"
                  step="50"
                />
              </div>
            </div>

            <div v-if="goalForm.targetValue && goalForm.targetDate" class="goal-simulation">
              <h4>Simulação</h4>
              <div class="simulation-results">
                <div class="simulation-item">
                  <span class="sim-label">Aporte sugerido</span>
                  <span class="sim-value">{{ formatCurrency(getSimulatedContribution()) }}</span>
                </div>
                <div class="simulation-item">
                  <span class="sim-label">Total de meses</span>
                  <span class="sim-value">{{ getMonthsToTarget() }}</span>
                </div>
                <div class="simulation-item">
                  <span class="sim-label">Com aporte atual</span>
                  <span class="sim-value">{{ getCompletionDate() }}</span>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModals" class="modal-btn cancel-btn">
            Cancelar
          </button>
          <button 
            @click="saveGoal" 
            class="modal-btn save-btn"
            :disabled="isSavingGoal"
          >
            <span v-if="isSavingGoal" class="spinner"></span>
            {{ isSavingGoal ? 'Salvando...' : (showEditModal ? 'Atualizar' : 'Criar Meta') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para Adicionar Contribuição -->
    <div v-if="showContributionModal" class="modal-overlay" @click="closeContributionModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Adicionar Aporte</h3>
          <button @click="closeContributionModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="contribution-goal-info">
            <h4>{{ selectedGoal?.title }}</h4>
            <div class="goal-progress-mini">
              <span>{{ formatCurrency(selectedGoal?.currentValue) }} / {{ formatCurrency(selectedGoal?.targetValue) }}</span>
              <div class="progress-bar-mini">
                <div 
                  class="progress-fill-mini" 
                  :style="{ width: `${getProgressPercentage(selectedGoal)}%` }"
                ></div>
              </div>
            </div>
          </div>
          
          <form @submit.prevent="submitContribution" class="contribution-form">
            <div class="form-group">
              <label for="contributionAmount">Valor do Aporte</label>
              <input
                id="contributionAmount"
                v-model="contributionForm.amount"
                type="number"
                class="form-input"
                :class="{ 'error': contributionErrors.amount }"
                placeholder="R$ 0,00"
                min="0"
                step="10"
                required
              />
              <span v-if="contributionErrors.amount" class="error-message">
                {{ contributionErrors.amount }}
              </span>
            </div>

            <div class="form-group">
              <label for="contributionDate">Data do Aporte</label>
              <input
                id="contributionDate"
                v-model="contributionForm.date"
                type="date"
                class="form-input"
                :max="today"
                required
              />
            </div>

            <div class="form-group">
              <label for="contributionNote">Observação (opcional)</label>
              <textarea
                id="contributionNote"
                v-model="contributionForm.note"
                class="form-textarea"
                placeholder="Adicione uma observação sobre este aporte..."
                rows="2"
              ></textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button @click="closeContributionModal" class="modal-btn cancel-btn">
            Cancelar
          </button>
          <button 
            @click="submitContribution" 
            class="modal-btn save-btn"
            :disabled="isAddingContribution"
          >
            <span v-if="isAddingContribution" class="spinner"></span>
            {{ isAddingContribution ? 'Adicionando...' : 'Adicionar Aporte' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { format, formatDistanceToNow, differenceInMonths, addMonths, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Composables
const router = useRouter()
const toast = useToast()

// State
const isInitialLoading = ref(true)
const isSavingGoal = ref(false)
const isAddingContribution = ref(false)
const searchTerm = ref('')
const selectedStatusFilter = ref('all')
const selectedCategoryFilter = ref('all')
const viewMode = ref('grid')
const currentPage = ref(1)
const goalsPerPage = ref(12)
const activeDropdown = ref(null)

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showContributionModal = ref(false)

// Forms
const goalForm = ref({
  title: '',
  description: '',
  category: '',
  targetValue: 0,
  currentValue: 0,
  targetDate: '',
  monthlyContribution: 0
})

const contributionForm = ref({
  amount: 0,
  date: '',
  note: ''
})

const selectedGoal = ref(null)

// Form errors
const goalErrors = ref({})
const contributionErrors = ref({})

// Mock data (substituir por store real)
const goals = ref([
  {
    id: 1,
    title: 'Casa Própria',
    description: 'Entrada para apartamento de 2 quartos',
    category: 'house',
    targetValue: 150000,
    currentValue: 45000,
    startDate: '2024-01-01',
    targetDate: '2026-12-31',
    monthlyContribution: 2500,
    status: 'active'
  },
  {
    id: 2,
    title: 'Reserva de Emergência',
    description: '6 meses de gastos essenciais',
    category: 'emergency',
    targetValue: 30000,
    currentValue: 28500,
    startDate: '2024-01-01',
    targetDate: '2024-12-31',
    monthlyContribution: 1000,
    status: 'active'
  },
  {
    id: 3,
    title: 'Viagem Europa',
    description: 'Lua de mel na Europa por 15 dias',
    category: 'travel',
    targetValue: 25000,
    currentValue: 25000,
    startDate: '2023-06-01',
    targetDate: '2024-06-01',
    monthlyContribution: 0,
    status: 'completed'
  }
])

// Computed
const hasError = ref(false)
const errorMessage = ref('')

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const totalGoals = computed(() => goals.value.length)
const activeGoals = computed(() => goals.value.filter(g => g.status === 'active').length)
const completedGoals = computed(() => goals.value.filter(g => g.status === 'completed').length)

const totalTargetValue = computed(() => {
  return goals.value
    .filter(g => g.status !== 'completed')
    .reduce((sum, goal) => sum + goal.targetValue, 0)
})

const averageProgress = computed(() => {
  const activeGoalsList = goals.value.filter(g => g.status === 'active')
  if (activeGoalsList.length === 0) return 0
  
  const totalProgress = activeGoalsList.reduce((sum, goal) => {
    return sum + getProgressPercentage(goal)
  }, 0)
  
  return Math.round(totalProgress / activeGoalsList.length)
})

const filteredGoals = computed(() => {
  let filtered = goals.value

  // Filtro por busca
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(goal => 
      goal.title.toLowerCase().includes(term) ||
      goal.description.toLowerCase().includes(term)
    )
  }

  // Filtro por status
  if (selectedStatusFilter.value !== 'all') {
    if (selectedStatusFilter.value === 'overdue') {
      filtered = filtered.filter(goal => isOverdue(goal))
    } else {
      filtered = filtered.filter(goal => goal.status === selectedStatusFilter.value)
    }
  }

  // Filtro por categoria
  if (selectedCategoryFilter.value !== 'all') {
    filtered = filtered.filter(goal => goal.category === selectedCategoryFilter.value)
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredGoals.value.length / goalsPerPage.value)
})

const paginatedGoals = computed(() => {
  const start = (currentPage.value - 1) * goalsPerPage.value
  const end = start + goalsPerPage.value
  return filteredGoals.value.slice(start, end)
})

// Methods
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (date) => {
  if (!date) return 'Não definido'
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

const getCategoryIcon = (category) => {
  const icons = {
    emergency: '🚨',
    house: '🏠',
    car: '🚗',
    travel: '✈️',
    retirement: '👴',
    education: '🎓',
    investment: '📈',
    other: '🎯'
  }
  return icons[category] || '🎯'
}

const getCategoryName = (category) => {
  const names = {
    emergency: 'Reserva de Emergência',
    house: 'Casa Própria',
    car: 'Veículo',
    travel: 'Viagem',
    retirement: 'Aposentadoria',
    education: 'Educação',
    investment: 'Investimento',
    other: 'Outros'
  }
  return names[category] || 'Outros'
}

const getStatusText = (status) => {
  const texts = {
    active: 'Ativa',
    completed: 'Concluída',
    paused: 'Pausada',
    cancelled: 'Cancelada'
  }
  return texts[status] || 'Desconhecido'
}

const getProgressPercentage = (goal) => {
  if (!goal || goal.targetValue === 0) return 0
  return Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
}

const getProgressClass = (goal) => {
  const percentage = getProgressPercentage(goal)
  if (percentage >= 100) return 'completed'
  if (percentage >= 75) return 'excellent'
  if (percentage >= 50) return 'good'
  if (percentage >= 25) return 'fair'
  return 'poor'
}

const isOverdue = (goal) => {
  if (goal.status === 'completed') return false
  return isBefore(new Date(goal.targetDate), new Date())
}

const getTimeRemaining = (goal) => {
  const targetDate = new Date(goal.targetDate)
  const now = new Date()
  
  if (goal.status === 'completed') return 'Concluída'
  if (isBefore(targetDate, now)) return 'Atrasada'
  
  return formatDistanceToNow(targetDate, { addSuffix: true, locale: ptBR })
}

const getSuggestedContribution = (goal) => {
  const remaining = goal.targetValue - goal.currentValue
  const monthsRemaining = differenceInMonths(new Date(goal.targetDate), new Date())
  
  if (monthsRemaining <= 0) return remaining
  return Math.ceil(remaining / monthsRemaining)
}

const getMonthsToTarget = () => {
  if (!goalForm.value.targetDate) return 0
  return differenceInMonths(new Date(goalForm.value.targetDate), new Date())
}

const getSimulatedContribution = () => {
  const remaining = (goalForm.value.targetValue || 0) - (goalForm.value.currentValue || 0)
  const months = getMonthsToTarget()
  
  if (months <= 0) return remaining
  return Math.ceil(remaining / months)
}

const getCompletionDate = () => {
  if (!goalForm.value.monthlyContribution || goalForm.value.monthlyContribution === 0) {
    return 'Sem aportes'
  }
  
  const remaining = (goalForm.value.targetValue || 0) - (goalForm.value.currentValue || 0)
  const monthsNeeded = Math.ceil(remaining / goalForm.value.monthlyContribution)
  
  const completionDate = addMonths(new Date(), monthsNeeded)
  return format(completionDate, 'MM/yyyy', { locale: ptBR })
}

const toggleDropdown = (goalId) => {
  activeDropdown.value = activeDropdown.value === goalId ? null : goalId
}

const validateGoal = () => {
  const errors = {}
  
  if (!goalForm.value.title.trim()) {
    errors.title = 'Título é obrigatório'
  }
  
  if (!goalForm.value.targetValue || goalForm.value.targetValue <= 0) {
    errors.targetValue = 'Valor objetivo deve ser maior que zero'
  }
  
  if (!goalForm.value.targetDate) {
    errors.targetDate = 'Data objetivo é obrigatória'
  } else if (isBefore(new Date(goalForm.value.targetDate), new Date())) {
    errors.targetDate = 'Data objetivo deve ser futura'
  }
  
  goalErrors.value = errors
  return Object.keys(errors).length === 0
}

const validateContribution = () => {
  const errors = {}
  
  if (!contributionForm.value.amount || contributionForm.value.amount <= 0) {
    errors.amount = 'Valor deve ser maior que zero'
  }
  
  contributionErrors.value = errors
  return Object.keys(errors).length === 0
}

const saveGoal = async () => {
  if (!validateGoal()) return
  
  try {
    isSavingGoal.value = true
    
    if (showEditModal.value) {
      // Atualizar meta existente
      const index = goals.value.findIndex(g => g.id === selectedGoal.value.id)
      if (index !== -1) {
        goals.value[index] = { ...goals.value[index], ...goalForm.value }
      }
      toast.success('Meta atualizada com sucesso!')
    } else {
      // Criar nova meta
      const newGoal = {
        id: Date.now(),
        ...goalForm.value,
        startDate: new Date().toISOString().split('T')[0],
        status: 'active'
      }
      goals.value.push(newGoal)
      toast.success('Meta criada com sucesso!')
    }
    
    closeModals()
  } catch (error) {
    console.error('Erro ao salvar meta:', error)
    toast.error('Erro ao salvar meta')
  } finally {
    isSavingGoal.value = false
  }
}

const addContribution = (goal) => {
  selectedGoal.value = goal
  contributionForm.value = {
    amount: goal.monthlyContribution || 0,
    date: today.value,
    note: ''
  }
  showContributionModal.value = true
}

const submitContribution = async () => {
  if (!validateContribution()) return
  
  try {
    isAddingContribution.value = true
    
    // Atualizar valor atual da meta
    const goalIndex = goals.value.findIndex(g => g.id === selectedGoal.value.id)
    if (goalIndex !== -1) {
      goals.value[goalIndex].currentValue += contributionForm.value.amount
      
      // Verificar se a meta foi concluída
      if (goals.value[goalIndex].currentValue >= goals.value[goalIndex].targetValue) {
        goals.value[goalIndex].status = 'completed'
        toast.success('🎉 Parabéns! Meta concluída!')
      } else {
        toast.success('Aporte adicionado com sucesso!')
      }
    }
    
    closeContributionModal()
  } catch (error) {
    console.error('Erro ao adicionar aporte:', error)
    toast.error('Erro ao adicionar aporte')
  } finally {
    isAddingContribution.value = false
  }
}

const editGoal = (goal) => {
  selectedGoal.value = goal
  goalForm.value = { ...goal }
  showEditModal.value = true
}

const viewGoalDetails = (goal) => {
  router.push(`/metas/${goal.id}`)
}

const pauseGoal = async (goal) => {
  try {
    const goalIndex = goals.value.findIndex(g => g.id === goal.id)
    if (goalIndex !== -1) {
      goals.value[goalIndex].status = 'paused'
      toast.success('Meta pausada')
    }
  } catch (error) {
    console.error('Erro ao pausar meta:', error)
    toast.error('Erro ao pausar meta')
  }
  activeDropdown.value = null
}

const resumeGoal = async (goal) => {
  try {
    const goalIndex = goals.value.findIndex(g => g.id === goal.id)
    if (goalIndex !== -1) {
      goals.value[goalIndex].status = 'active'
      toast.success('Meta retomada')
    }
  } catch (error) {
    console.error('Erro ao retomar meta:', error)
    toast.error('Erro ao retomar meta')
  }
  activeDropdown.value = null
}

const markAsCompleted = async (goal) => {
  try {
    const goalIndex = goals.value.findIndex(g => g.id === goal.id)
    if (goalIndex !== -1) {
      goals.value[goalIndex].status = 'completed'
      goals.value[goalIndex].currentValue = goals.value[goalIndex].targetValue
      toast.success('🎉 Meta marcada como concluída!')
    }
  } catch (error) {
    console.error('Erro ao marcar meta como concluída:', error)
    toast.error('Erro ao marcar meta como concluída')
  }
  activeDropdown.value = null
}

const duplicateGoal = async (goal) => {
  try {
    const newGoal = {
      ...goal,
      id: Date.now(),
      title: `${goal.title} (Cópia)`,
      currentValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active'
    }
    goals.value.push(newGoal)
    toast.success('Meta duplicada com sucesso!')
  } catch (error) {
    console.error('Erro ao duplicar meta:', error)
    toast.error('Erro ao duplicar meta')
  }
  activeDropdown.value = null
}

const deleteGoal = async (goal) => {
  if (!confirm(`Tem certeza que deseja excluir a meta "${goal.title}"?`)) return
  
  try {
    const goalIndex = goals.value.findIndex(g => g.id === goal.id)
    if (goalIndex !== -1) {
      goals.value.splice(goalIndex, 1)
      toast.success('Meta excluída')
    }
  } catch (error) {
    console.error('Erro ao excluir meta:', error)
    toast.error('Erro ao excluir meta')
  }
  activeDropdown.value = null
}

const exportGoals = async () => {
  try {
    toast.info('Exportando metas...')
    // Implementar exportação
    toast.success('Metas exportadas com sucesso!')
  } catch (error) {
    console.error('Erro na exportação:', error)
    toast.error('Erro ao exportar metas')
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  selectedGoal.value = null
  goalForm.value = {
    title: '',
    description: '',
    category: '',
    targetValue: 0,
    currentValue: 0,
    targetDate: '',
    monthlyContribution: 0
  }
  goalErrors.value = {}
}

const closeContributionModal = () => {
  showContributionModal.value = false
  selectedGoal.value = null
  contributionForm.value = {
    amount: 0,
    date: '',
    note: ''
  }
  contributionErrors.value = {}
}

const retryLoad = async () => {
  isInitialLoading.value = true
  await loadGoalsData()
}

const loadGoalsData = async () => {
  try {
    isInitialLoading.value = true
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('Erro ao carregar metas:', error)
    toast.error('Erro ao carregar metas')
  } finally {
    isInitialLoading.value = false
  }
}

// Watchers
watch([selectedStatusFilter, selectedCategoryFilter, searchTerm], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(async () => {
  await loadGoalsData()
})
</script>

<style scoped>
.metas-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.metas-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.create-btn, .export-btn {
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

.create-btn {
  background: #6c63ff;
  color: white;
}

.create-btn:hover {
  background: #5a52d5;
  transform: translateY(-1px);
}

.export-btn {
  background: #e2e8f0;
  color: #4a5568;
}

.export-btn:hover {
  background: #cbd5e0;
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

.metas-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.goals-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #4a5568;
}

.card-icon {
  font-size: 1.5rem;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.card-info {
  font-size: 0.9rem;
  color: #718096;
}

.goals-filters {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 200px;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
}

.view-toggle {
  display: flex;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  padding: 0.5rem 0.75rem;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background: #f7fafc;
}

.view-btn.active {
  background: #6c63ff;
  color: white;
}

.no-goals {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-goals-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-goals h3 {
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.no-goals p {
  color: #718096;
  margin-bottom: 2rem;
}

.create-first-btn {
  background: #6c63ff;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.create-first-btn:hover {
  background: #5a52d5;
}

.goals-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.goals-container.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.goal-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  border-left: 4px solid #e2e8f0;
}

.goal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.goal-card.active {
  border-left-color: #6c63ff;
}

.goal-card.completed {
  border-left-color: #00e676;
  background: #f0fff4;
}

.goal-card.paused {
  border-left-color: #ffc107;
  background: #fffbf0;
}

.goal-card.overdue {
  border-left-color: #f44336;
  background: #fff5f5;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.goal-info {
  flex: 1;
}

.goal-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.category-icon {
  font-size: 1.2rem;
}

.category-name {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
}

.goal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.goal-description {
  color: #718096;
  font-size: 0.9rem;
  line-height: 1.4;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.paused {
  background: #fff8e1;
  color: #f57c00;
}

.goal-progress {
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
}

.progress-percentage {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1a202c;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s;
}

.progress-fill.completed { background: #00e676; }
.progress-fill.excellent { background: #4caf50; }
.progress-fill.good { background: #8bc34a; }
.progress-fill.fair { background: #ffc107; }
.progress-fill.poor { background: #ff9800; }

.progress-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.current-value {
  font-weight: 600;
  color: #1a202c;
}

.target-value {
  color: #718096;
}

.goal-timeline {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.timeline-label {
  font-size: 0.8rem;
  color: #718096;
  text-transform: uppercase;
  font-weight: 600;
}

.timeline-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a202c;
}

.timeline-value.overdue {
  color: #f44336;
}

.goal-contribution {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f0fff4;
  border-radius: 8px;
  border: 1px solid #c8e6c9;
}

.contribution-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.contribution-label {
  font-size: 0.875rem;
  color: #2e7d32;
  font-weight: 600;
}

.contribution-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1b5e20;
}

.contribution-suggestion {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-label {
  font-size: 0.8rem;
  color: #4caf50;
  font-weight: 600;
}

.suggestion-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: #2e7d32;
}

.goal-actions {
  display: flex;
  gap: 0.5rem;
  position: relative;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  justify-content: center;
}

.contribute-btn {
  background: #00e676;
  color: white;
}

.contribute-btn:hover:not(:disabled) {
  background: #00c853;
}

.details-btn {
  background: #e2e8f0;
  color: #4a5568;
}

.details-btn:hover {
  background: #cbd5e0;
}

.edit-btn {
  background: #ffc107;
  color: #1a202c;
}

.edit-btn:hover {
  background: #ffb300;
}

.dropdown-btn {
  background: #f7fafc;
  color: #4a5568;
  min-width: 40px;
  flex: none;
}

.dropdown-btn:hover {
  background: #edf2f7;
}

.action-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 150px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f7fafc;
}

.dropdown-item.danger {
  color: #f44336;
}

.dropdown-item.danger:hover {
  background: #ffebee;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #6c63ff;
  color: #6c63ff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #718096;
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
  max-width: 600px;
  max-height: 90vh;
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

.goal-form, .contribution-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.goal-simulation {
  margin-top: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.goal-simulation h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 1rem;
}

.simulation-results {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.simulation-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.sim-label {
  font-size: 0.8rem;
  color: #718096;
  text-transform: uppercase;
  font-weight: 600;
}

.sim-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a202c;
}

.contribution-goal-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.contribution-goal-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.goal-progress-mini {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar-mini {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: #6c63ff;
  border-radius: 3px;
  transition: width 0.4s;
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

.save-btn {
  background: #6c63ff;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #5a52d5;
}

.modal-btn:disabled {
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

@media (max-width: 1200px) {
  .goals-container.grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .metas-container {
    padding: 1rem;
  }
  
  .metas-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .goals-summary {
    grid-template-columns: 1fr;
  }
  
  .goals-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .search-input {
    width: 100%;
  }
  
  .goals-container.grid {
    grid-template-columns: 1fr;
  }
  
  .goal-timeline {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .timeline-item {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .goal-actions {
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: none;
    min-width: 80px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .simulation-results {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .simulation-item {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>

