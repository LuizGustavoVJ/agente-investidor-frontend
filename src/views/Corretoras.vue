<template>
  <div class="corretoras-container">
    <div class="corretoras-header">
      <div class="header-content">
        <h1 class="page-title">Minhas Corretoras</h1>
        <p class="page-subtitle">Conecte suas corretoras para sincronizar automaticamente seus investimentos</p>
      </div>
      
      <div class="header-actions">
        <button 
          @click="syncAllBrokers" 
          class="sync-btn"
          :disabled="isSyncing"
          :class="{ 'syncing': isSyncing }"
        >
          <span class="sync-icon">🔄</span>
          {{ isSyncing ? 'Sincronizando...' : 'Sincronizar Todas' }}
        </button>
        
        <button @click="showAddBrokerModal = true" class="add-btn">
          <span class="add-icon">➕</span>
          Conectar Corretora
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isInitialLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando suas corretoras...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Erro ao carregar corretoras</h3>
      <p>{{ errorMessage }}</p>
      <button @click="retryLoad" class="retry-button">Tentar novamente</button>
    </div>

    <!-- Corretoras Content -->
    <div v-else class="corretoras-content">
      <!-- Status Overview -->
      <div class="status-overview">
        <div class="status-card">
          <div class="card-header">
            <h3>Corretoras Conectadas</h3>
            <span class="card-icon">🏦</span>
          </div>
          <div class="card-value">{{ connectedBrokers.length }}</div>
          <div class="card-info">de {{ availableBrokers.length }} disponíveis</div>
        </div>

        <div class="status-card">
          <div class="card-header">
            <h3>Última Sincronização</h3>
            <span class="card-icon">🕒</span>
          </div>
          <div class="card-value">{{ formatDate(lastSyncDate) }}</div>
          <div class="card-info">{{ getTimeAgo(lastSyncDate) }}</div>
        </div>

        <div class="status-card">
          <div class="card-header">
            <h3>Ativos Sincronizados</h3>
            <span class="card-icon">📊</span>
          </div>
          <div class="card-value">{{ totalSyncedAssets }}</div>
          <div class="card-info">diferentes ativos</div>
        </div>

        <div class="status-card">
          <div class="card-header">
            <h3>Status Geral</h3>
            <span class="card-icon">{{ getOverallStatusIcon() }}</span>
          </div>
          <div class="card-value status" :class="getOverallStatusClass()">
            {{ getOverallStatusText() }}
          </div>
          <div class="card-info">{{ getOverallStatusDescription() }}</div>
        </div>
      </div>

      <!-- Corretoras Conectadas -->
      <div class="connected-brokers-section">
        <div class="section-header">
          <h3>Corretoras Conectadas</h3>
          <div class="section-actions">
            <div class="search-box">
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Buscar corretora..."
                class="search-input"
              />
              <span class="search-icon">🔍</span>
            </div>
          </div>
        </div>

        <div v-if="filteredConnectedBrokers.length === 0" class="no-brokers">
          <div class="no-brokers-icon">🏦</div>
          <h3>Nenhuma corretora conectada</h3>
          <p>Conecte suas corretoras para começar a sincronizar seus investimentos automaticamente</p>
          <button @click="showAddBrokerModal = true" class="connect-first-btn">
            Conectar Primeira Corretora
          </button>
        </div>

        <div v-else class="brokers-grid">
          <div 
            v-for="broker in filteredConnectedBrokers" 
            :key="broker.id"
            class="broker-card"
            :class="getBrokerStatusClass(broker.status)"
          >
            <div class="broker-header">
              <div class="broker-info">
                <img :src="broker.logo" :alt="broker.name" class="broker-logo" />
                <div class="broker-details">
                  <h4 class="broker-name">{{ broker.name }}</h4>
                  <p class="broker-account">{{ broker.accountInfo }}</p>
                </div>
              </div>
              <div class="broker-status">
                <span class="status-badge" :class="getBrokerStatusClass(broker.status)">
                  {{ getBrokerStatusText(broker.status) }}
                </span>
              </div>
            </div>

            <div class="broker-stats">
              <div class="stat-item">
                <span class="stat-label">Ativos</span>
                <span class="stat-value">{{ broker.assetsCount || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Valor Total</span>
                <span class="stat-value">{{ formatCurrency(broker.totalValue) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Última Sync</span>
                <span class="stat-value">{{ formatDate(broker.lastSync) }}</span>
              </div>
            </div>

            <div v-if="broker.status === 'error'" class="broker-error">
              <div class="error-message">
                <span class="error-icon">⚠️</span>
                <span>{{ broker.errorMessage || 'Erro na sincronização' }}</span>
              </div>
            </div>

            <div class="broker-actions">
              <button 
                @click="syncBroker(broker)"
                class="action-btn sync-broker-btn"
                :disabled="broker.status === 'syncing'"
              >
                <span class="btn-icon">🔄</span>
                {{ broker.status === 'syncing' ? 'Sincronizando...' : 'Sincronizar' }}
              </button>
              
              <button 
                @click="viewBrokerDetails(broker)"
                class="action-btn details-btn"
              >
                <span class="btn-icon">📋</span>
                Detalhes
              </button>
              
              <button 
                @click="configureBroker(broker)"
                class="action-btn config-btn"
              >
                <span class="btn-icon">⚙️</span>
                Configurar
              </button>
              
              <button 
                @click="disconnectBroker(broker)"
                class="action-btn disconnect-btn"
              >
                <span class="btn-icon">🔌</span>
                Desconectar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Corretoras Disponíveis -->
      <div class="available-brokers-section">
        <div class="section-header">
          <h3>Corretoras Disponíveis</h3>
          <p class="section-subtitle">Conecte mais corretoras para ter uma visão completa dos seus investimentos</p>
        </div>

        <div class="available-brokers-grid">
          <div 
            v-for="broker in availableToConnect" 
            :key="broker.id"
            class="available-broker-card"
          >
            <div class="available-broker-header">
              <img :src="broker.logo" :alt="broker.name" class="broker-logo" />
              <div class="broker-info">
                <h4 class="broker-name">{{ broker.name }}</h4>
                <p class="broker-description">{{ broker.description }}</p>
              </div>
            </div>

            <div class="broker-features">
              <div class="feature-item" v-for="feature in broker.features" :key="feature">
                <span class="feature-icon">✓</span>
                <span class="feature-text">{{ feature }}</span>
              </div>
            </div>

            <div class="broker-connect-action">
              <button 
                @click="connectBroker(broker)"
                class="connect-btn"
                :disabled="isConnecting === broker.id"
              >
                <span v-if="isConnecting === broker.id" class="spinner"></span>
                {{ isConnecting === broker.id ? 'Conectando...' : 'Conectar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Histórico de Sincronização -->
      <div class="sync-history-section">
        <div class="section-header">
          <h3>Histórico de Sincronização</h3>
          <div class="history-filter">
            <select v-model="selectedHistoryFilter" class="filter-select">
              <option value="all">Todas as corretoras</option>
              <option v-for="broker in connectedBrokers" :key="broker.id" :value="broker.id">
                {{ broker.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="filteredSyncHistory.length === 0" class="no-history">
          <div class="no-history-icon">📊</div>
          <h3>Nenhum histórico encontrado</h3>
          <p>O histórico de sincronização aparecerá aqui após as primeiras sincronizações</p>
        </div>

        <div v-else class="sync-history-list">
          <div 
            v-for="entry in paginatedSyncHistory" 
            :key="entry.id"
            class="history-entry"
            :class="entry.status"
          >
            <div class="entry-header">
              <div class="entry-info">
                <img :src="entry.brokerLogo" :alt="entry.brokerName" class="entry-broker-logo" />
                <div class="entry-details">
                  <h5 class="entry-broker">{{ entry.brokerName }}</h5>
                  <p class="entry-date">{{ formatDate(entry.timestamp) }}</p>
                </div>
              </div>
              <div class="entry-status">
                <span class="status-badge" :class="entry.status">
                  {{ getSyncStatusText(entry.status) }}
                </span>
              </div>
            </div>

            <div class="entry-content">
              <div class="entry-stats">
                <div class="stat">
                  <span class="stat-label">Ativos Sincronizados</span>
                  <span class="stat-value">{{ entry.assetsSynced || 0 }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Duração</span>
                  <span class="stat-value">{{ entry.duration || 'N/A' }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Dados Atualizados</span>
                  <span class="stat-value">{{ entry.dataUpdated || 0 }}</span>
                </div>
              </div>

              <div v-if="entry.status === 'error' && entry.errorDetails" class="entry-error">
                <span class="error-icon">⚠️</span>
                <span class="error-text">{{ entry.errorDetails }}</span>
              </div>
            </div>
          </div>

          <!-- Paginação do Histórico -->
          <div v-if="totalHistoryPages > 1" class="pagination">
            <button 
              @click="currentHistoryPage = 1" 
              :disabled="currentHistoryPage === 1"
              class="page-btn"
            >
              ««
            </button>
            <button 
              @click="currentHistoryPage--" 
              :disabled="currentHistoryPage === 1"
              class="page-btn"
            >
              «
            </button>
            
            <span class="page-info">
              Página {{ currentHistoryPage }} de {{ totalHistoryPages }}
            </span>
            
            <button 
              @click="currentHistoryPage++" 
              :disabled="currentHistoryPage === totalHistoryPages"
              class="page-btn"
            >
              »
            </button>
            <button 
              @click="currentHistoryPage = totalHistoryPages" 
              :disabled="currentHistoryPage === totalHistoryPages"
              class="page-btn"
            >
              »»
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Adicionar Corretora -->
    <div v-if="showAddBrokerModal" class="modal-overlay" @click="closeAddBrokerModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Conectar Nova Corretora</h3>
          <button @click="closeAddBrokerModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="broker-selection">
            <div 
              v-for="broker in availableToConnect" 
              :key="broker.id"
              class="broker-option"
              :class="{ 'selected': selectedBrokerToAdd === broker.id }"
              @click="selectedBrokerToAdd = broker.id"
            >
              <img :src="broker.logo" :alt="broker.name" class="option-logo" />
              <div class="option-info">
                <h4>{{ broker.name }}</h4>
                <p>{{ broker.description }}</p>
              </div>
              <div class="option-check">
                <span v-if="selectedBrokerToAdd === broker.id">✓</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeAddBrokerModal" class="modal-btn cancel-btn">
            Cancelar
          </button>
          <button 
            @click="connectSelectedBroker" 
            class="modal-btn connect-btn"
            :disabled="!selectedBrokerToAdd || isConnecting"
          >
            <span v-if="isConnecting" class="spinner"></span>
            {{ isConnecting ? 'Conectando...' : 'Conectar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBrokersStore } from '@/stores/brokers'
import { useToast } from 'vue-toastification'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Composables
const router = useRouter()
const brokersStore = useBrokersStore()
const toast = useToast()

// State
const isInitialLoading = ref(true)
const isSyncing = ref(false)
const isConnecting = ref(null)
const searchTerm = ref('')
const selectedHistoryFilter = ref('all')
const currentHistoryPage = ref(1)
const historyPerPage = ref(10)
const showAddBrokerModal = ref(false)
const selectedBrokerToAdd = ref(null)

// Computed
const isLoading = computed(() => brokersStore.isLoading)
const hasError = computed(() => !!brokersStore.error)
const errorMessage = computed(() => brokersStore.error || 'Erro desconhecido')

const connectedBrokers = computed(() => brokersStore.connectedBrokers || [])
const availableBrokers = computed(() => brokersStore.availableBrokers || [])
const syncHistory = computed(() => brokersStore.syncHistory || [])
const lastSyncDate = computed(() => brokersStore.lastSyncDate)
const totalSyncedAssets = computed(() => brokersStore.totalSyncedAssets || 0)

const availableToConnect = computed(() => {
  const connectedIds = connectedBrokers.value.map(b => b.id)
  return availableBrokers.value.filter(b => !connectedIds.includes(b.id))
})

const filteredConnectedBrokers = computed(() => {
  if (!searchTerm.value) return connectedBrokers.value
  
  const term = searchTerm.value.toLowerCase()
  return connectedBrokers.value.filter(broker => 
    broker.name.toLowerCase().includes(term) ||
    broker.accountInfo?.toLowerCase().includes(term)
  )
})

const filteredSyncHistory = computed(() => {
  if (selectedHistoryFilter.value === 'all') {
    return syncHistory.value
  }
  
  return syncHistory.value.filter(entry => entry.brokerId === selectedHistoryFilter.value)
})

const totalHistoryPages = computed(() => {
  return Math.ceil(filteredSyncHistory.value.length / historyPerPage.value)
})

const paginatedSyncHistory = computed(() => {
  const start = (currentHistoryPage.value - 1) * historyPerPage.value
  const end = start + historyPerPage.value
  return filteredSyncHistory.value.slice(start, end)
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
  if (!date) return 'Nunca'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

const getTimeAgo = (date) => {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

const getOverallStatusIcon = () => {
  const errorCount = connectedBrokers.value.filter(b => b.status === 'error').length
  const syncingCount = connectedBrokers.value.filter(b => b.status === 'syncing').length
  
  if (errorCount > 0) return '⚠️'
  if (syncingCount > 0) return '🔄'
  if (connectedBrokers.value.length === 0) return '❌'
  return '✅'
}

const getOverallStatusClass = () => {
  const errorCount = connectedBrokers.value.filter(b => b.status === 'error').length
  const syncingCount = connectedBrokers.value.filter(b => b.status === 'syncing').length
  
  if (errorCount > 0) return 'error'
  if (syncingCount > 0) return 'syncing'
  if (connectedBrokers.value.length === 0) return 'disconnected'
  return 'connected'
}

const getOverallStatusText = () => {
  const errorCount = connectedBrokers.value.filter(b => b.status === 'error').length
  const syncingCount = connectedBrokers.value.filter(b => b.status === 'syncing').length
  
  if (errorCount > 0) return 'Com Erros'
  if (syncingCount > 0) return 'Sincronizando'
  if (connectedBrokers.value.length === 0) return 'Desconectado'
  return 'Conectado'
}

const getOverallStatusDescription = () => {
  const errorCount = connectedBrokers.value.filter(b => b.status === 'error').length
  const syncingCount = connectedBrokers.value.filter(b => b.status === 'syncing').length
  
  if (errorCount > 0) return `${errorCount} corretora(s) com erro`
  if (syncingCount > 0) return `${syncingCount} corretora(s) sincronizando`
  if (connectedBrokers.value.length === 0) return 'Nenhuma corretora conectada'
  return 'Todas as corretoras funcionando'
}

const getBrokerStatusClass = (status) => {
  switch (status) {
    case 'connected': return 'connected'
    case 'syncing': return 'syncing'
    case 'error': return 'error'
    case 'disconnected': return 'disconnected'
    default: return 'unknown'
  }
}

const getBrokerStatusText = (status) => {
  switch (status) {
    case 'connected': return 'Conectada'
    case 'syncing': return 'Sincronizando'
    case 'error': return 'Erro'
    case 'disconnected': return 'Desconectada'
    default: return 'Desconhecido'
  }
}

const getSyncStatusText = (status) => {
  switch (status) {
    case 'success': return 'Sucesso'
    case 'error': return 'Erro'
    case 'partial': return 'Parcial'
    case 'cancelled': return 'Cancelado'
    default: return 'Desconhecido'
  }
}

const syncAllBrokers = async () => {
  try {
    isSyncing.value = true
    toast.info('Sincronizando todas as corretoras...')
    
    await brokersStore.syncAllBrokers()
    
    toast.success('Sincronização concluída!')
  } catch (error) {
    console.error('Erro na sincronização:', error)
    toast.error('Erro na sincronização das corretoras')
  } finally {
    isSyncing.value = false
  }
}

const syncBroker = async (broker) => {
  try {
    toast.info(`Sincronizando ${broker.name}...`)
    
    await brokersStore.syncBroker(broker.id)
    
    toast.success(`${broker.name} sincronizada com sucesso!`)
  } catch (error) {
    console.error('Erro na sincronização:', error)
    toast.error(`Erro ao sincronizar ${broker.name}`)
  }
}

const connectBroker = async (broker) => {
  try {
    isConnecting.value = broker.id
    toast.info(`Conectando ${broker.name}...`)
    
    await brokersStore.connectBroker(broker.id)
    
    toast.success(`${broker.name} conectada com sucesso!`)
  } catch (error) {
    console.error('Erro na conexão:', error)
    toast.error(`Erro ao conectar ${broker.name}`)
  } finally {
    isConnecting.value = null
  }
}

const connectSelectedBroker = async () => {
  if (!selectedBrokerToAdd.value) return
  
  const broker = availableToConnect.value.find(b => b.id === selectedBrokerToAdd.value)
  if (broker) {
    await connectBroker(broker)
    closeAddBrokerModal()
  }
}

const disconnectBroker = async (broker) => {
  if (!confirm(`Tem certeza que deseja desconectar ${broker.name}?`)) return
  
  try {
    toast.info(`Desconectando ${broker.name}...`)
    
    await brokersStore.disconnectBroker(broker.id)
    
    toast.success(`${broker.name} desconectada com sucesso!`)
  } catch (error) {
    console.error('Erro na desconexão:', error)
    toast.error(`Erro ao desconectar ${broker.name}`)
  }
}

const viewBrokerDetails = (broker) => {
  router.push(`/corretoras/${broker.id}`)
}

const configureBroker = (broker) => {
  router.push(`/corretoras/${broker.id}/configuracao`)
}

const closeAddBrokerModal = () => {
  showAddBrokerModal.value = false
  selectedBrokerToAdd.value = null
}

const retryLoad = async () => {
  isInitialLoading.value = true
  await loadBrokersData()
}

const loadBrokersData = async () => {
  try {
    isInitialLoading.value = true
    await brokersStore.loadAllData()
  } catch (error) {
    console.error('Erro ao carregar corretoras:', error)
    toast.error('Erro ao carregar dados das corretoras')
  } finally {
    isInitialLoading.value = false
  }
}

// Watchers
watch(() => selectedHistoryFilter.value, () => {
  currentHistoryPage.value = 1
})

// Lifecycle
onMounted(async () => {
  await loadBrokersData()
})
</script>

<style scoped>
.corretoras-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.corretoras-header {
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

.sync-btn, .add-btn {
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

.sync-btn {
  background: #6c63ff;
  color: white;
}

.sync-btn:hover:not(:disabled) {
  background: #5a52d5;
  transform: translateY(-1px);
}

.sync-btn.syncing .sync-icon {
  animation: spin 1s linear infinite;
}

.add-btn {
  background: #00e676;
  color: white;
}

.add-btn:hover {
  background: #00c853;
  transform: translateY(-1px);
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

.corretoras-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.status-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.status-card:hover {
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

.card-value.status.connected {
  color: #00e676;
}

.card-value.status.error {
  color: #f44336;
}

.card-value.status.syncing {
  color: #ffc107;
}

.card-value.status.disconnected {
  color: #9e9e9e;
}

.card-info {
  font-size: 0.9rem;
  color: #718096;
}

.connected-brokers-section, .available-brokers-section, .sync-history-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
}

.section-subtitle {
  color: #718096;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.section-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
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

.no-brokers {
  text-align: center;
  padding: 3rem 1rem;
}

.no-brokers-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-brokers h3 {
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.no-brokers p {
  color: #718096;
  margin-bottom: 1.5rem;
}

.connect-first-btn {
  background: #6c63ff;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.connect-first-btn:hover {
  background: #5a52d5;
}

.brokers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.broker-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.broker-card:hover {
  border-color: #cbd5e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.broker-card.connected {
  border-color: #00e676;
  background: #f0fff4;
}

.broker-card.error {
  border-color: #f44336;
  background: #fff5f5;
}

.broker-card.syncing {
  border-color: #ffc107;
  background: #fffbf0;
}

.broker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.broker-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.broker-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
}

.broker-details h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.broker-details p {
  font-size: 0.9rem;
  color: #718096;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.connected {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.error {
  background: #ffebee;
  color: #d32f2f;
}

.status-badge.syncing {
  background: #fff8e1;
  color: #f57c00;
}

.status-badge.disconnected {
  background: #f5f5f5;
  color: #757575;
}

.broker-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #718096;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a202c;
}

.broker-error {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #ffebee;
  border-radius: 6px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #d32f2f;
  font-size: 0.875rem;
}

.broker-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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
  min-width: 80px;
}

.sync-broker-btn {
  background: #6c63ff;
  color: white;
}

.sync-broker-btn:hover:not(:disabled) {
  background: #5a52d5;
}

.details-btn {
  background: #e2e8f0;
  color: #4a5568;
}

.details-btn:hover {
  background: #cbd5e0;
}

.config-btn {
  background: #ffc107;
  color: #1a202c;
}

.config-btn:hover {
  background: #ffb300;
}

.disconnect-btn {
  background: #f44336;
  color: white;
}

.disconnect-btn:hover {
  background: #d32f2f;
}

.available-brokers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.available-broker-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.available-broker-card:hover {
  border-color: #6c63ff;
  box-shadow: 0 4px 12px rgba(108, 99, 255, 0.1);
}

.available-broker-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.broker-features {
  margin-bottom: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.feature-icon {
  color: #00e676;
  font-weight: 600;
}

.broker-connect-action {
  text-align: center;
}

.connect-btn {
  background: #6c63ff;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.connect-btn:hover:not(:disabled) {
  background: #5a52d5;
  transform: translateY(-1px);
}

.connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.no-history {
  text-align: center;
  padding: 3rem 1rem;
}

.no-history-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.sync-history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-entry {
  border: 1px solid #e2e8f0;
  border-left: 4px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
}

.history-entry:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-entry.success {
  border-left-color: #00e676;
}

.history-entry.error {
  border-left-color: #f44336;
}

.history-entry.partial {
  border-left-color: #ffc107;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.entry-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.entry-broker-logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: contain;
}

.entry-details h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.entry-details p {
  font-size: 0.8rem;
  color: #718096;
}

.entry-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.entry-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.entry-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #ffebee;
  border-radius: 6px;
  color: #d32f2f;
  font-size: 0.875rem;
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

.broker-selection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.broker-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.broker-option:hover {
  border-color: #cbd5e0;
}

.broker-option.selected {
  border-color: #6c63ff;
  background: #f7faff;
}

.option-logo {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: contain;
}

.option-info {
  flex: 1;
}

.option-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.option-info p {
  font-size: 0.875rem;
  color: #718096;
}

.option-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c63ff;
  font-weight: 600;
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

.modal-btn.connect-btn {
  background: #6c63ff;
  color: white;
}

.modal-btn.connect-btn:hover:not(:disabled) {
  background: #5a52d5;
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .brokers-grid {
    grid-template-columns: 1fr;
  }
  
  .available-brokers-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .corretoras-container {
    padding: 1rem;
  }
  
  .corretoras-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .status-overview {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .search-input {
    width: 100%;
  }
  
  .broker-stats {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .broker-actions {
    flex-direction: column;
  }
  
  .action-btn {
    flex: none;
  }
  
  .entry-stats {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .stat {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>

