<template>
  <div class="dashboard-bg">
    <div class="dashboard-content">
      <!-- Header com informações do usuário -->
      <div class="dashboard-header">
        <div class="user-info">
          <span class="user-greeting">Olá, {{ userDisplayName }}</span>
          <span class="last-update" v-if="lastUpdate">
            Última atualização: {{ formatDate(lastUpdate) }}
          </span>
        </div>
        
        <div class="header-actions">
          <button 
            @click="syncData" 
            class="sync-button"
            :disabled="isLoading"
            :class="{ 'syncing': isLoading }"
          >
            <span class="sync-icon">🔄</span>
            {{ isLoading ? 'Sincronizando...' : 'Sincronizar' }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isInitialLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Carregando seus dados...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar dados</h3>
        <p>{{ errorMessage }}</p>
        <button @click="retryLoad" class="retry-button">Tentar novamente</button>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="dashboard-main-grid">
        <!-- Alertas Críticos -->
        <div v-if="criticalAlerts.length > 0" class="critical-alerts">
          <div class="alert-item" v-for="alert in criticalAlerts" :key="alert.id">
            <span class="alert-icon">🚨</span>
            <span class="alert-message">{{ alert.message }}</span>
            <button @click="markAlertAsRead(alert.id)" class="alert-dismiss">×</button>
          </div>
        </div>

        <!-- Primeira linha: Resumo + Alocação -->
        <div class="dashboard-row">
          <!-- Card Principal - Patrimônio Total -->
          <div class="dashboard-card card-main">
            <div class="card-title">Patrimônio Total</div>
            <div class="card-row">
              <span class="card-value">{{ formatCurrency(totalValue) }}</span>
              <span class="card-variation" :class="gainClass">
                {{ formatPercent(totalGainPercent) }} 
                <span>({{ formatCurrency(totalGain, true) }})</span>
              </span>
            </div>
            <div class="card-row card-row-bottom">
              <span class="card-aportes">
                Aportes <b>{{ formatCurrency(totalInvested) }}</b>
              </span>
              <span class="card-metas">
                Metas <b>{{ activeGoals.length }}</b>
              </span>
            </div>
          </div>

          <!-- Gráfico de Alocação -->
          <div class="dashboard-pie">
            <ul class="pie-legend-vertical">
              <li v-for="(value, type) in assetsByType" :key="type">
                <span class="dot" :class="getTypeClass(type)"></span>
                {{ getTypeLabel(type) }}
                <span class="percent">{{ formatPercent(value.percentage) }}</span>
              </li>
            </ul>
            <div class="dashboard-pie-canvas">
              <canvas ref="allocationChart" id="alocacaoAtivos"></canvas>
            </div>
          </div>
        </div>

        <!-- Segunda linha: Evolução + Metas -->
        <div class="dashboard-row">
          <!-- Gráfico de Evolução -->
          <div class="dashboard-graph">
            <div class="graph-title">Evolução do Patrimônio</div>
            <canvas ref="evolutionChart" id="evolucaoPatrimonio"></canvas>
          </div>

          <!-- Metas -->
          <div class="dashboard-metas">
            <div class="metas-title">Metas</div>
            <div v-if="activeGoals.length === 0" class="no-goals">
              <p>Nenhuma meta definida</p>
              <button @click="createGoal" class="create-goal-btn">Criar primeira meta</button>
            </div>
            <div v-else>
              <div v-for="goal in activeGoals.slice(0, 3)" :key="goal.id" class="meta-item">
                <span>{{ goal.name }}</span>
                <span class="meta-valor">{{ formatCurrency(goal.targetAmount) }}</span>
              </div>
              <div class="meta-progress-bar">
                <div 
                  class="meta-progress" 
                  :style="{ width: `${getGoalProgress()}%` }"
                ></div>
              </div>
              <router-link to="/metas" class="meta-link">Ver todas as metas</router-link>
            </div>
          </div>
        </div>

        <!-- Terceira linha: Tabela de Ativos -->
        <div class="dashboard-row">
          <div class="dashboard-table">
            <div class="table-header">
              <div class="table-title">Principais Ativos</div>
              <router-link to="/portfolio" class="view-all-link">Ver todos</router-link>
            </div>
            
            <div v-if="topAssets.length === 0" class="no-assets">
              <p>Nenhum ativo encontrado</p>
              <router-link to="/corretoras" class="connect-broker-btn">
                Conectar corretora
              </router-link>
            </div>
            
            <table v-else>
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>Corretora</th>
                  <th>Quantidade</th>
                  <th>Preço Atual</th>
                  <th>Valor Total</th>
                  <th>Variação</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="asset in topAssets.slice(0, 5)" :key="asset.symbol">
                  <td>
                    <div class="asset-info">
                      <span class="asset-symbol">{{ asset.symbol }}</span>
                      <span class="asset-name">{{ asset.name }}</span>
                    </div>
                  </td>
                  <td>{{ asset.broker }}</td>
                  <td>{{ formatNumber(asset.quantity) }}</td>
                  <td>{{ formatCurrency(asset.currentPrice) }}</td>
                  <td>{{ formatCurrency(asset.currentValue) }}</td>
                  <td :class="asset.variation >= 0 ? 'positive' : 'negative'">
                    {{ formatPercent(asset.variation) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quarta linha: Recomendações IA -->
        <div class="dashboard-row">
          <div class="dashboard-recomendacao">
            <div class="recomendacao-icon">💡</div>
            <div class="recomendacao-content">
              <div class="recomendacao-title">Recomendação da IA</div>
              <div class="recomendacao-desc">
                {{ currentRecommendation?.message || 'Analisando seu portfólio...' }}
                <br>
                <span class="alerta" v-if="currentRecommendation?.priority === 'high'">
                  Oportunidade de Alta Prioridade
                </span>
              </div>
            </div>
            <div class="recomendacao-actions">
              <button 
                v-if="currentRecommendation" 
                @click="acceptRecommendation" 
                class="btn-aceitar"
              >
                Aceitar
              </button>
              <button @click="viewAllRecommendations" class="btn-ver-mais">
                Ver mais
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAnalysisStore } from '@/stores/analysis'
import { useBrokersStore } from '@/stores/brokers'
import { useToast } from 'vue-toastification'
import Chart from 'chart.js/auto'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const portfolioStore = usePortfolioStore()
const analysisStore = useAnalysisStore()
const brokersStore = useBrokersStore()
const toast = useToast()

// Refs para gráficos
const allocationChart = ref(null)
const evolutionChart = ref(null)

// State
const isInitialLoading = ref(true)
const chartInstances = ref({})

// Computed
const userDisplayName = computed(() => {
  return authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Usuário'
})

const isLoading = computed(() => {
  return portfolioStore.isLoading || analysisStore.isLoading || brokersStore.isLoading
})

const hasError = computed(() => {
  return portfolioStore.error || analysisStore.error || brokersStore.error
})

const errorMessage = computed(() => {
  return portfolioStore.error || analysisStore.error || brokersStore.error || 'Erro desconhecido'
})

const lastUpdate = computed(() => {
  return portfolioStore.lastUpdate || brokersStore.lastSync
})

const totalValue = computed(() => portfolioStore.totalValue)
const totalGain = computed(() => portfolioStore.totalGain)
const totalGainPercent = computed(() => portfolioStore.totalGainPercent)
const totalInvested = computed(() => portfolioStore.totalInvested)
const assetsByType = computed(() => portfolioStore.assetsByType)
const topAssets = computed(() => portfolioStore.topAssets)
const activeGoals = computed(() => portfolioStore.activeGoals)
const criticalAlerts = computed(() => analysisStore.criticalAlerts)
const currentRecommendation = computed(() => analysisStore.recentRecommendations[0])

const gainClass = computed(() => {
  const gain = totalGainPercent.value
  return {
    'positivo': gain > 0,
    'negativo': gain < 0,
    'neutro': gain === 0
  }
})

// Methods
const formatCurrency = (value, showSign = false) => {
  if (value === null || value === undefined) return 'R$ 0,00'
  
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
  
  const formatted = formatter.format(Math.abs(value))
  
  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`
  }
  
  return formatted
}

const formatPercent = (value) => {
  if (value === null || value === undefined) return '0,00%'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'
  
  return new Intl.NumberFormat('pt-BR').format(value)
}

const formatDate = (date) => {
  if (!date) return ''
  
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

const getTypeLabel = (type) => {
  const labels = {
    'stocks': 'Ações',
    'fiis': 'FIIs',
    'bonds': 'Renda Fixa',
    'funds': 'Fundos',
    'crypto': 'Criptomoedas',
    'others': 'Outros'
  }
  return labels[type] || type
}

const getTypeClass = (type) => {
  const classes = {
    'stocks': 'renda-variavel',
    'fiis': 'fundos-imobiliarios',
    'bonds': 'renda-fixa',
    'funds': 'fundos',
    'crypto': 'criptomoedas',
    'others': 'outros'
  }
  return classes[type] || 'outros'
}

const getGoalProgress = () => {
  if (activeGoals.value.length === 0) return 0
  
  const totalTarget = activeGoals.value.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const currentValue = totalValue.value
  
  return Math.min((currentValue / totalTarget) * 100, 100)
}

const syncData = async () => {
  try {
    toast.info('Sincronizando dados...')
    
    await Promise.all([
      portfolioStore.syncBrokers(),
      portfolioStore.loadAllData(),
      analysisStore.loadAllData()
    ])
    
    toast.success('Dados sincronizados com sucesso!')
    
    // Atualizar gráficos
    await nextTick()
    updateCharts()
  } catch (error) {
    console.error('Erro na sincronização:', error)
    toast.error('Erro na sincronização dos dados')
  }
}

const retryLoad = async () => {
  isInitialLoading.value = true
  await loadDashboardData()
}

const markAlertAsRead = async (alertId) => {
  try {
    const result = await analysisStore.markAlertAsRead(alertId)
    if (result.success) {
      toast.success('Alerta marcado como lido')
    }
  } catch (error) {
    console.error('Erro ao marcar alerta:', error)
    toast.error('Erro ao marcar alerta como lido')
  }
}

const acceptRecommendation = () => {
  if (currentRecommendation.value) {
    toast.info('Funcionalidade em desenvolvimento')
    // Implementar lógica de aceitar recomendação
  }
}

const viewAllRecommendations = () => {
  router.push('/analises')
}

const createGoal = () => {
  router.push('/metas')
}

const createAllocationChart = () => {
  if (!allocationChart.value || !assetsByType.value) return
  
  const ctx = allocationChart.value.getContext('2d')
  
  // Destruir gráfico anterior se existir
  if (chartInstances.value.allocation) {
    chartInstances.value.allocation.destroy()
  }
  
  const data = Object.entries(assetsByType.value)
  const labels = data.map(([type]) => getTypeLabel(type))
  const values = data.map(([, value]) => value.percentage)
  const colors = ['#4a6cf7', '#6cc3ff', '#a3bffa', '#e0e7ff', '#ffd93d', '#ff6b6b']
  
  chartInstances.value.allocation = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, values.length),
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${formatPercent(context.parsed)}`
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

const createEvolutionChart = () => {
  if (!evolutionChart.value || !portfolioStore.evolution) return
  
  const ctx = evolutionChart.value.getContext('2d')
  
  // Destruir gráfico anterior se existir
  if (chartInstances.value.evolution) {
    chartInstances.value.evolution.destroy()
  }
  
  const evolution = portfolioStore.evolution
  const labels = evolution.map(point => format(new Date(point.date), 'MMM', { locale: ptBR }))
  const values = evolution.map(point => point.value)
  
  chartInstances.value.evolution = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Evolução',
        data: values,
        borderColor: '#6c63ff',
        backgroundColor: 'rgba(108,99,255,0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#6c63ff',
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed.y)
            }
          }
        }
      },
      scales: {
        y: { 
          beginAtZero: false, 
          grid: { color: '#e0e7ff' }, 
          ticks: { 
            color: '#627179',
            callback: function(value) {
              return formatCurrency(value)
            }
          }
        },
        x: { 
          grid: { display: false }, 
          ticks: { color: '#627179' } 
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

const updateCharts = () => {
  nextTick(() => {
    createAllocationChart()
    createEvolutionChart()
  })
}

const loadDashboardData = async () => {
  try {
    isInitialLoading.value = true
    
    // Carregar dados em paralelo
    await Promise.all([
      portfolioStore.loadAllData(),
      analysisStore.loadAllData(),
      brokersStore.loadAllData()
    ])
    
    // Criar gráficos após carregar dados
    await nextTick()
    updateCharts()
    
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
    toast.error('Erro ao carregar dados do dashboard')
  } finally {
    isInitialLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loadDashboardData()
})
</script>

<style scoped>
/* Estilos base mantidos do componente original */
body, html, #app {
  overflow-x: hidden !important;
}

.dashboard-bg {
  width: 100vw;
  min-height: 100vh;
  background: #f4f6fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
}

.dashboard-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(35,41,70,0.07);
  padding: 2.5rem 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-x: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-greeting {
  color: #232946;
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
}

.last-update {
  color: #718096;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.sync-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.sync-button:hover:not(:disabled) {
  background: #5a52d5;
  transform: translateY(-1px);
}

.sync-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sync-button.syncing .sync-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.error-container {
  color: #e53e3e;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-button {
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #5a52d5;
}

.critical-alerts {
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.alert-icon {
  font-size: 1.2rem;
}

.alert-message {
  flex: 1;
  color: #c53030;
  font-weight: 500;
}

.alert-dismiss {
  background: none;
  border: none;
  color: #c53030;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.alert-dismiss:hover {
  background: rgba(197, 48, 48, 0.1);
}

/* Estilos do dashboard original mantidos */
.dashboard-main-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-row {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  width: 100%;
}

.dashboard-card.card-main {
  background: linear-gradient(90deg, #6c63ff 60%, #00bcd4 100%);
  color: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(35,41,70,0.08);
  padding: 2rem 2.5rem;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  flex: 1.2;
  align-items: flex-start;
  text-align: left;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.card-value {
  font-size: 2.1rem;
  font-weight: bold;
}

.card-variation {
  font-size: 1.1rem;
  font-weight: 600;
}

.card-variation.positivo {
  color: #00e676;
}

.card-variation.negativo {
  color: #ff5252;
}

.card-variation.neutro {
  color: #ffd93d;
}

.card-aportes, .card-metas {
  font-size: 1rem;
  font-weight: 400;
}

.card-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.2rem;
}

.card-row-bottom {
  margin-top: 0.7rem;
  gap: 2.5rem;
}

.dashboard-pie {
  background: #f4f6fa;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(35,41,70,0.04);
  padding: 1.2rem 1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 320px;
  flex: 1;
  gap: 1.5rem;
}

.pie-legend-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  font-size: 0.98rem;
  color: #232946;
  min-width: 120px;
  justify-content: center;
  list-style: none;
  padding: 0;
  margin: 0;
}

.pie-legend-vertical li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
  font-weight: 600;
}

.pie-legend-vertical .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.4rem;
  display: inline-block;
}

.pie-legend-vertical .renda-variavel { background: #4a6cf7; }
.pie-legend-vertical .fundos-imobiliarios { background: #6cc3ff; }
.pie-legend-vertical .renda-fixa { background: #a3bffa; }
.pie-legend-vertical .fundos { background: #e0e7ff; }
.pie-legend-vertical .criptomoedas { background: #ffd93d; }
.pie-legend-vertical .outros { background: #ff6b6b; }

.pie-legend-vertical .percent {
  color: #627179;
  font-weight: 500;
  margin-left: auto;
  font-size: 0.97em;
}

.dashboard-pie-canvas {
  width: 180px;
  height: 180px;
  position: relative;
}

.dashboard-pie canvas {
  width: 180px !important;
  height: 180px !important;
}

.dashboard-graph {
  background: #f4f6fa;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(35,41,70,0.04);
  padding: 1.2rem 1rem;
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 320px;
}

.graph-title {
  color: #232946;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.7rem;
}

.dashboard-graph canvas {
  width: 100% !important;
  height: 140px !important;
}

.dashboard-metas {
  background: #f4f6fa;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(35,41,70,0.04);
  padding: 1.2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-width: 320px;
  flex: 1;
}

.metas-title {
  color: #232946;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.7rem;
}

.no-goals {
  text-align: center;
  padding: 2rem 1rem;
}

.no-goals p {
  color: #718096;
  margin-bottom: 1rem;
}

.create-goal-btn {
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.create-goal-btn:hover {
  background: #5a52d5;
}

.meta-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  margin-bottom: 0.5rem;
}

.meta-valor {
  color: #6c63ff;
  font-weight: 700;
}

.meta-progress-bar {
  width: 100%;
  height: 12px;
  background: #e0e7ff;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.meta-progress {
  height: 100%;
  background: linear-gradient(90deg, #6c63ff 60%, #00bcd4 100%);
  border-radius: 8px;
  transition: width 0.4s;
}

.meta-link {
  color: #00bcd4;
  text-decoration: underline;
  font-size: 0.98rem;
  margin-top: 0.2rem;
  cursor: pointer;
}

.dashboard-table {
  background: #f4f6fa;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(35,41,70,0.04);
  padding: 1.2rem 1rem;
  width: 100%;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-title {
  color: #232946;
  font-size: 1.1rem;
  font-weight: 700;
}

.view-all-link {
  color: #6c63ff;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: #5a52d5;
  text-decoration: underline;
}

.no-assets {
  text-align: center;
  padding: 2rem 1rem;
}

.no-assets p {
  color: #718096;
  margin-bottom: 1rem;
}

.connect-broker-btn {
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s;
}

.connect-broker-btn:hover {
  background: #5a52d5;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.98rem;
}

th, td {
  padding: 0.6rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  color: #6c63ff;
  font-weight: 700;
  background: #eef2f4;
}

td {
  color: #232946;
  font-weight: 500;
  background: #fff;
}

.asset-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.asset-symbol {
  font-weight: 700;
  color: #232946;
}

.asset-name {
  font-size: 0.85rem;
  color: #718096;
}

.positive {
  color: #00e676;
  font-weight: 600;
}

.negative {
  color: #ff5252;
  font-weight: 600;
}

.dashboard-recomendacao {
  background: #f4f6fa;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(35,41,70,0.04);
  padding: 1.2rem 1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.2rem;
  margin-top: 1.5rem;
}

.recomendacao-icon {
  font-size: 2.2rem;
  color: #6c63ff;
  background: #e0e7ff;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recomendacao-content {
  flex: 1;
}

.recomendacao-title {
  color: #232946;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.recomendacao-desc {
  color: #232946;
  font-size: 0.98rem;
  margin-bottom: 0.5rem;
}

.alerta {
  color: #6c63ff;
  font-weight: 700;
  font-size: 0.95rem;
  margin-left: 0.3rem;
}

.recomendacao-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-aceitar, .btn-ver-mais {
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-aceitar {
  background: #00bcd4;
  color: #fff;
}

.btn-aceitar:hover {
  background: #00acc1;
}

.btn-ver-mais {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-ver-mais:hover {
  background: #cbd5e0;
}

@media (max-width: 1100px) {
  .dashboard-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .dashboard-card.card-main, 
  .dashboard-pie, 
  .dashboard-graph, 
  .dashboard-metas {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 700px) {
  .dashboard-content {
    padding: 1.2rem 0.5rem;
    gap: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .dashboard-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .dashboard-pie {
    flex-direction: column;
    gap: 1rem;
  }
  
  .dashboard-recomendacao {
    flex-direction: column;
    text-align: center;
  }
  
  .recomendacao-actions {
    justify-content: center;
  }
}
</style>

