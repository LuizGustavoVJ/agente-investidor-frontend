<template>
  <div class="system-health-dashboard">
    <div class="dashboard-header">
      <h2 class="header-title">System Health Dashboard</h2>
      <p class="header-subtitle">Monitoramento em tempo real da infraestrutura e performance do sistema</p>
      <div class="header-actions">
        <button @click="refreshData" :disabled="isRefreshing" class="refresh-btn">
          <span class="refresh-icon" :class="{ spinning: isRefreshing }">🔄</span>
          {{ isRefreshing ? 'Atualizando...' : 'Atualizar' }}
        </button>
        <div class="auto-refresh">
          <label class="auto-refresh-label">
            <input 
              v-model="autoRefresh"
              type="checkbox"
              class="auto-refresh-checkbox"
            />
            <span class="auto-refresh-text">Auto-refresh (30s)</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Status Geral -->
    <div class="overall-status">
      <div class="status-card" :class="overallStatus.status">
        <div class="status-icon">
          <span v-if="overallStatus.status === 'healthy'">✅</span>
          <span v-else-if="overallStatus.status === 'warning'">⚠️</span>
          <span v-else>❌</span>
        </div>
        <div class="status-content">
          <h3 class="status-title">{{ overallStatus.title }}</h3>
          <p class="status-description">{{ overallStatus.description }}</p>
          <div class="status-metrics">
            <div class="metric">
              <span class="metric-label">Uptime</span>
              <span class="metric-value">{{ overallStatus.uptime }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Última Atualização</span>
              <span class="metric-value">{{ formatTime(overallStatus.lastUpdate) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Métricas Principais -->
    <div class="main-metrics">
      <div class="metrics-grid">
        <div 
          v-for="metric in mainMetrics" 
          :key="metric.id"
          class="metric-card"
          :class="metric.status"
        >
          <div class="metric-header">
            <div class="metric-icon">{{ metric.icon }}</div>
            <div class="metric-info">
              <h4 class="metric-name">{{ metric.name }}</h4>
              <p class="metric-description">{{ metric.description }}</p>
            </div>
          </div>
          <div class="metric-value-section">
            <div class="metric-current">
              <span class="current-value">{{ metric.currentValue }}</span>
              <span class="current-unit">{{ metric.unit }}</span>
            </div>
            <div class="metric-trend" :class="metric.trend">
              <span class="trend-icon">
                {{ metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️' }}
              </span>
              <span class="trend-value">{{ metric.trendValue }}</span>
            </div>
          </div>
          <div class="metric-chart">
            <canvas :ref="`chart-${metric.id}`" class="mini-chart"></canvas>
          </div>
          <div class="metric-threshold">
            <div class="threshold-bar">
              <div 
                class="threshold-fill" 
                :style="{ width: `${metric.percentage}%` }"
                :class="metric.status"
              ></div>
            </div>
            <div class="threshold-labels">
              <span class="threshold-min">{{ metric.min }}</span>
              <span class="threshold-max">{{ metric.max }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Serviços e Microserviços -->
    <div class="services-section">
      <h3 class="section-title">Status dos Serviços</h3>
      <div class="services-grid">
        <div 
          v-for="service in services" 
          :key="service.id"
          class="service-card"
          :class="service.status"
        >
          <div class="service-header">
            <div class="service-status-indicator" :class="service.status"></div>
            <div class="service-info">
              <h4 class="service-name">{{ service.name }}</h4>
              <p class="service-description">{{ service.description }}</p>
            </div>
            <div class="service-actions">
              <button @click="restartService(service)" class="action-btn restart">
                🔄 Restart
              </button>
              <button @click="viewLogs(service)" class="action-btn logs">
                📋 Logs
              </button>
            </div>
          </div>

          <div class="service-metrics">
            <div class="service-metric">
              <span class="metric-label">CPU</span>
              <div class="metric-bar">
                <div 
                  class="metric-fill" 
                  :style="{ width: `${service.cpu}%` }"
                  :class="{ warning: service.cpu > 70, critical: service.cpu > 90 }"
                ></div>
              </div>
              <span class="metric-value">{{ service.cpu }}%</span>
            </div>

            <div class="service-metric">
              <span class="metric-label">Memória</span>
              <div class="metric-bar">
                <div 
                  class="metric-fill" 
                  :style="{ width: `${service.memory}%` }"
                  :class="{ warning: service.memory > 70, critical: service.memory > 90 }"
                ></div>
              </div>
              <span class="metric-value">{{ service.memory }}%</span>
            </div>

            <div class="service-metric">
              <span class="metric-label">Requests/min</span>
              <span class="metric-value">{{ formatNumber(service.requestsPerMinute) }}</span>
            </div>

            <div class="service-metric">
              <span class="metric-label">Response Time</span>
              <span class="metric-value">{{ service.responseTime }}ms</span>
            </div>

            <div class="service-metric">
              <span class="metric-label">Error Rate</span>
              <span class="metric-value" :class="{ warning: service.errorRate > 1, critical: service.errorRate > 5 }">
                {{ service.errorRate }}%
              </span>
            </div>

            <div class="service-metric">
              <span class="metric-label">Uptime</span>
              <span class="metric-value">{{ service.uptime }}</span>
            </div>
          </div>

          <div class="service-endpoints">
            <h5 class="endpoints-title">Endpoints Principais</h5>
            <div class="endpoints-list">
              <div 
                v-for="endpoint in service.endpoints" 
                :key="endpoint.path"
                class="endpoint-item"
                :class="endpoint.status"
              >
                <span class="endpoint-method" :class="endpoint.method.toLowerCase()">
                  {{ endpoint.method }}
                </span>
                <span class="endpoint-path">{{ endpoint.path }}</span>
                <span class="endpoint-status">{{ endpoint.responseTime }}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Infraestrutura -->
    <div class="infrastructure-section">
      <h3 class="section-title">Infraestrutura</h3>
      <div class="infrastructure-grid">
        <!-- Database -->
        <div class="infra-card">
          <div class="infra-header">
            <div class="infra-icon">🗄️</div>
            <div class="infra-info">
              <h4 class="infra-name">Database (PostgreSQL)</h4>
              <p class="infra-description">Banco de dados principal</p>
            </div>
            <div class="infra-status" :class="database.status">{{ getStatusLabel(database.status) }}</div>
          </div>
          <div class="infra-metrics">
            <div class="infra-metric">
              <span class="metric-label">Conexões Ativas</span>
              <span class="metric-value">{{ database.activeConnections }}/{{ database.maxConnections }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Tamanho do DB</span>
              <span class="metric-value">{{ database.size }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Queries/seg</span>
              <span class="metric-value">{{ database.queriesPerSecond }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Cache Hit Rate</span>
              <span class="metric-value">{{ database.cacheHitRate }}%</span>
            </div>
          </div>
        </div>

        <!-- Redis Cache -->
        <div class="infra-card">
          <div class="infra-header">
            <div class="infra-icon">⚡</div>
            <div class="infra-info">
              <h4 class="infra-name">Redis Cache</h4>
              <p class="infra-description">Cache em memória</p>
            </div>
            <div class="infra-status" :class="redis.status">{{ getStatusLabel(redis.status) }}</div>
          </div>
          <div class="infra-metrics">
            <div class="infra-metric">
              <span class="metric-label">Memória Usada</span>
              <span class="metric-value">{{ redis.memoryUsed }}/{{ redis.memoryTotal }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Keys</span>
              <span class="metric-value">{{ formatNumber(redis.totalKeys) }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Hit Rate</span>
              <span class="metric-value">{{ redis.hitRate }}%</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Ops/seg</span>
              <span class="metric-value">{{ formatNumber(redis.operationsPerSecond) }}</span>
            </div>
          </div>
        </div>

        <!-- Message Queue -->
        <div class="infra-card">
          <div class="infra-header">
            <div class="infra-icon">📨</div>
            <div class="infra-info">
              <h4 class="infra-name">Message Queue (Kafka)</h4>
              <p class="infra-description">Sistema de mensageria</p>
            </div>
            <div class="infra-status" :class="kafka.status">{{ getStatusLabel(kafka.status) }}</div>
          </div>
          <div class="infra-metrics">
            <div class="infra-metric">
              <span class="metric-label">Mensagens/seg</span>
              <span class="metric-value">{{ formatNumber(kafka.messagesPerSecond) }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Lag Total</span>
              <span class="metric-value">{{ formatNumber(kafka.totalLag) }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Partições</span>
              <span class="metric-value">{{ kafka.partitions }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Consumers</span>
              <span class="metric-value">{{ kafka.consumers }}</span>
            </div>
          </div>
        </div>

        <!-- Load Balancer -->
        <div class="infra-card">
          <div class="infra-header">
            <div class="infra-icon">⚖️</div>
            <div class="infra-info">
              <h4 class="infra-name">Load Balancer (Nginx)</h4>
              <p class="infra-description">Balanceador de carga</p>
            </div>
            <div class="infra-status" :class="nginx.status">{{ getStatusLabel(nginx.status) }}</div>
          </div>
          <div class="infra-metrics">
            <div class="infra-metric">
              <span class="metric-label">Requests/seg</span>
              <span class="metric-value">{{ formatNumber(nginx.requestsPerSecond) }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Conexões Ativas</span>
              <span class="metric-value">{{ nginx.activeConnections }}</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">Upstream Health</span>
              <span class="metric-value">{{ nginx.upstreamHealth }}%</span>
            </div>
            <div class="infra-metric">
              <span class="metric-label">SSL Cert</span>
              <span class="metric-value">{{ nginx.sslExpiry }} dias</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas e Logs -->
    <div class="alerts-logs-section">
      <div class="alerts-column">
        <h3 class="section-title">Alertas Ativos</h3>
        <div class="alerts-list">
          <div 
            v-for="alert in activeAlerts" 
            :key="alert.id"
            class="alert-item"
            :class="alert.severity"
          >
            <div class="alert-icon">
              <span v-if="alert.severity === 'critical'">🚨</span>
              <span v-else-if="alert.severity === 'warning'">⚠️</span>
              <span v-else>ℹ️</span>
            </div>
            <div class="alert-content">
              <h4 class="alert-title">{{ alert.title }}</h4>
              <p class="alert-message">{{ alert.message }}</p>
              <div class="alert-meta">
                <span class="alert-service">{{ alert.service }}</span>
                <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
              </div>
            </div>
            <div class="alert-actions">
              <button @click="acknowledgeAlert(alert)" class="alert-btn ack">
                ✓ Reconhecer
              </button>
              <button @click="resolveAlert(alert)" class="alert-btn resolve">
                ✗ Resolver
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="logs-column">
        <h3 class="section-title">Logs Recentes</h3>
        <div class="logs-controls">
          <select v-model="selectedLogLevel" class="log-level-select">
            <option value="all">Todos os Níveis</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          <select v-model="selectedLogService" class="log-service-select">
            <option value="all">Todos os Serviços</option>
            <option v-for="service in services" :key="service.id" :value="service.id">
              {{ service.name }}
            </option>
          </select>
        </div>
        <div class="logs-list">
          <div 
            v-for="log in filteredLogs" 
            :key="log.id"
            class="log-item"
            :class="log.level"
          >
            <div class="log-timestamp">{{ formatTime(log.timestamp) }}</div>
            <div class="log-level" :class="log.level">{{ log.level.toUpperCase() }}</div>
            <div class="log-service">{{ log.service }}</div>
            <div class="log-message">{{ log.message }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Charts -->
    <div class="performance-section">
      <h3 class="section-title">Performance Histórica</h3>
      <div class="charts-grid">
        <div class="chart-card">
          <h4 class="chart-title">CPU Usage (24h)</h4>
          <canvas ref="cpuChart" class="performance-chart"></canvas>
        </div>
        <div class="chart-card">
          <h4 class="chart-title">Memory Usage (24h)</h4>
          <canvas ref="memoryChart" class="performance-chart"></canvas>
        </div>
        <div class="chart-card">
          <h4 class="chart-title">Request Rate (24h)</h4>
          <canvas ref="requestChart" class="performance-chart"></canvas>
        </div>
        <div class="chart-card">
          <h4 class="chart-title">Response Time (24h)</h4>
          <canvas ref="responseChart" class="performance-chart"></canvas>
        </div>
      </div>
    </div>

    <!-- SLA e Métricas de Negócio -->
    <div class="sla-section">
      <h3 class="section-title">SLA e Métricas de Negócio</h3>
      <div class="sla-grid">
        <div class="sla-card">
          <div class="sla-header">
            <h4 class="sla-title">Disponibilidade</h4>
            <div class="sla-target">Target: 99.9%</div>
          </div>
          <div class="sla-value" :class="{ warning: slaMetrics.availability < 99.5, critical: slaMetrics.availability < 99 }">
            {{ slaMetrics.availability }}%
          </div>
          <div class="sla-periods">
            <div class="sla-period">
              <span class="period-label">Hoje</span>
              <span class="period-value">{{ slaMetrics.availabilityToday }}%</span>
            </div>
            <div class="sla-period">
              <span class="period-label">7 dias</span>
              <span class="period-value">{{ slaMetrics.availability7d }}%</span>
            </div>
            <div class="sla-period">
              <span class="period-label">30 dias</span>
              <span class="period-value">{{ slaMetrics.availability30d }}%</span>
            </div>
          </div>
        </div>

        <div class="sla-card">
          <div class="sla-header">
            <h4 class="sla-title">Response Time</h4>
            <div class="sla-target">Target: < 200ms</div>
          </div>
          <div class="sla-value" :class="{ warning: slaMetrics.responseTime > 200, critical: slaMetrics.responseTime > 500 }">
            {{ slaMetrics.responseTime }}ms
          </div>
          <div class="sla-periods">
            <div class="sla-period">
              <span class="period-label">P50</span>
              <span class="period-value">{{ slaMetrics.responseTimeP50 }}ms</span>
            </div>
            <div class="sla-period">
              <span class="period-label">P95</span>
              <span class="period-value">{{ slaMetrics.responseTimeP95 }}ms</span>
            </div>
            <div class="sla-period">
              <span class="period-label">P99</span>
              <span class="period-value">{{ slaMetrics.responseTimeP99 }}ms</span>
            </div>
          </div>
        </div>

        <div class="sla-card">
          <div class="sla-header">
            <h4 class="sla-title">Error Rate</h4>
            <div class="sla-target">Target: < 0.1%</div>
          </div>
          <div class="sla-value" :class="{ warning: slaMetrics.errorRate > 0.1, critical: slaMetrics.errorRate > 1 }">
            {{ slaMetrics.errorRate }}%
          </div>
          <div class="sla-periods">
            <div class="sla-period">
              <span class="period-label">4xx</span>
              <span class="period-value">{{ slaMetrics.errorRate4xx }}%</span>
            </div>
            <div class="sla-period">
              <span class="period-label">5xx</span>
              <span class="period-value">{{ slaMetrics.errorRate5xx }}%</span>
            </div>
            <div class="sla-period">
              <span class="period-label">Timeout</span>
              <span class="period-value">{{ slaMetrics.timeoutRate }}%</span>
            </div>
          </div>
        </div>

        <div class="sla-card">
          <div class="sla-header">
            <h4 class="sla-title">Throughput</h4>
            <div class="sla-target">Target: > 1000 req/min</div>
          </div>
          <div class="sla-value" :class="{ warning: slaMetrics.throughput < 1000, critical: slaMetrics.throughput < 500 }">
            {{ formatNumber(slaMetrics.throughput) }}
          </div>
          <div class="sla-periods">
            <div class="sla-period">
              <span class="period-label">Pico</span>
              <span class="period-value">{{ formatNumber(slaMetrics.peakThroughput) }}</span>
            </div>
            <div class="sla-period">
              <span class="period-label">Média</span>
              <span class="period-value">{{ formatNumber(slaMetrics.avgThroughput) }}</span>
            </div>
            <div class="sla-period">
              <span class="period-label">Mínimo</span>
              <span class="period-value">{{ formatNumber(slaMetrics.minThroughput) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'SystemHealthDashboard',
  setup() {
    const isRefreshing = ref(false)
    const autoRefresh = ref(true)
    const selectedLogLevel = ref('all')
    const selectedLogService = ref('all')
    
    let refreshInterval = null
    let charts = {}

    // Overall Status
    const overallStatus = reactive({
      status: 'healthy',
      title: 'Sistema Operacional',
      description: 'Todos os serviços funcionando normalmente',
      uptime: '99.97%',
      lastUpdate: new Date()
    })

    // Main Metrics
    const mainMetrics = reactive([
      {
        id: 'cpu',
        name: 'CPU Usage',
        description: 'Uso médio de CPU',
        icon: '🖥️',
        currentValue: '23.5',
        unit: '%',
        trend: 'stable',
        trendValue: '+0.2%',
        status: 'healthy',
        percentage: 23.5,
        min: '0%',
        max: '100%'
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        description: 'Uso de memória RAM',
        icon: '💾',
        currentValue: '67.8',
        unit: '%',
        trend: 'up',
        trendValue: '+2.1%',
        status: 'warning',
        percentage: 67.8,
        min: '0%',
        max: '100%'
      },
      {
        id: 'disk',
        name: 'Disk Usage',
        description: 'Uso de armazenamento',
        icon: '💿',
        currentValue: '45.2',
        unit: '%',
        trend: 'up',
        trendValue: '+1.5%',
        status: 'healthy',
        percentage: 45.2,
        min: '0%',
        max: '100%'
      },
      {
        id: 'network',
        name: 'Network I/O',
        description: 'Tráfego de rede',
        icon: '🌐',
        currentValue: '125.3',
        unit: 'MB/s',
        trend: 'down',
        trendValue: '-5.2%',
        status: 'healthy',
        percentage: 62.6,
        min: '0',
        max: '200 MB/s'
      }
    ])

    // Services
    const services = reactive([
      {
        id: 'auth-service',
        name: 'Auth Service',
        description: 'Serviço de autenticação e autorização',
        status: 'healthy',
        cpu: 15.2,
        memory: 45.8,
        requestsPerMinute: 1250,
        responseTime: 85,
        errorRate: 0.02,
        uptime: '99.98%',
        endpoints: [
          { method: 'POST', path: '/api/auth/login', status: 'healthy', responseTime: 120 },
          { method: 'POST', path: '/api/auth/refresh', status: 'healthy', responseTime: 45 },
          { method: 'GET', path: '/api/auth/profile', status: 'healthy', responseTime: 65 }
        ]
      },
      {
        id: 'data-service',
        name: 'Data Service',
        description: 'Serviço de dados financeiros',
        status: 'healthy',
        cpu: 28.7,
        memory: 62.3,
        requestsPerMinute: 3450,
        responseTime: 145,
        errorRate: 0.08,
        uptime: '99.95%',
        endpoints: [
          { method: 'GET', path: '/api/data/stocks', status: 'healthy', responseTime: 180 },
          { method: 'GET', path: '/api/data/portfolio', status: 'healthy', responseTime: 95 },
          { method: 'POST', path: '/api/data/sync', status: 'warning', responseTime: 320 }
        ]
      },
      {
        id: 'analysis-service',
        name: 'Analysis Service',
        description: 'Serviço de análises e metodologias',
        status: 'warning',
        cpu: 75.4,
        memory: 82.1,
        requestsPerMinute: 890,
        responseTime: 285,
        errorRate: 0.15,
        uptime: '99.89%',
        endpoints: [
          { method: 'POST', path: '/api/analysis/methodology', status: 'healthy', responseTime: 250 },
          { method: 'GET', path: '/api/analysis/recommendations', status: 'warning', responseTime: 450 },
          { method: 'POST', path: '/api/analysis/backtest', status: 'healthy', responseTime: 1200 }
        ]
      },
      {
        id: 'methodology-service',
        name: 'Methodology Service',
        description: 'Serviço de metodologias de investimento',
        status: 'healthy',
        cpu: 22.1,
        memory: 38.9,
        requestsPerMinute: 567,
        responseTime: 95,
        errorRate: 0.03,
        uptime: '99.97%',
        endpoints: [
          { method: 'GET', path: '/api/methodology/list', status: 'healthy', responseTime: 75 },
          { method: 'POST', path: '/api/methodology/execute', status: 'healthy', responseTime: 185 },
          { method: 'GET', path: '/api/methodology/results', status: 'healthy', responseTime: 110 }
        ]
      }
    ])

    // Infrastructure
    const database = reactive({
      status: 'healthy',
      activeConnections: 45,
      maxConnections: 100,
      size: '2.3 GB',
      queriesPerSecond: 1250,
      cacheHitRate: 94.5
    })

    const redis = reactive({
      status: 'healthy',
      memoryUsed: '1.2 GB',
      memoryTotal: '4.0 GB',
      totalKeys: 125430,
      hitRate: 97.8,
      operationsPerSecond: 8950
    })

    const kafka = reactive({
      status: 'healthy',
      messagesPerSecond: 2340,
      totalLag: 125,
      partitions: 24,
      consumers: 8
    })

    const nginx = reactive({
      status: 'healthy',
      requestsPerSecond: 1850,
      activeConnections: 234,
      upstreamHealth: 100,
      sslExpiry: 87
    })

    // Alerts
    const activeAlerts = reactive([
      {
        id: 1,
        severity: 'warning',
        title: 'High Memory Usage',
        message: 'Analysis Service está usando 82% da memória disponível',
        service: 'analysis-service',
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        id: 2,
        severity: 'info',
        title: 'SSL Certificate Renewal',
        message: 'Certificado SSL expira em 87 dias',
        service: 'nginx',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 3,
        severity: 'warning',
        title: 'Slow Response Time',
        message: 'Endpoint /api/analysis/recommendations com tempo de resposta elevado',
        service: 'analysis-service',
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      }
    ])

    // Logs
    const logs = reactive([
      {
        id: 1,
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        level: 'error',
        service: 'analysis-service',
        message: 'Failed to connect to external API: timeout after 30s'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        level: 'warning',
        service: 'data-service',
        message: 'High memory usage detected: 82% of available memory'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        level: 'info',
        service: 'auth-service',
        message: 'User authentication successful for user ID: 12345'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        level: 'debug',
        service: 'methodology-service',
        message: 'Executing methodology: Warren Buffett Value Investing'
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        level: 'info',
        service: 'data-service',
        message: 'Portfolio sync completed successfully for 1,234 assets'
      }
    ])

    // SLA Metrics
    const slaMetrics = reactive({
      availability: 99.97,
      availabilityToday: 100.0,
      availability7d: 99.95,
      availability30d: 99.97,
      responseTime: 145,
      responseTimeP50: 95,
      responseTimeP95: 285,
      responseTimeP99: 450,
      errorRate: 0.08,
      errorRate4xx: 0.05,
      errorRate5xx: 0.03,
      timeoutRate: 0.01,
      throughput: 1850,
      peakThroughput: 3200,
      avgThroughput: 1650,
      minThroughput: 890
    })

    // Computed
    const filteredLogs = computed(() => {
      return logs.filter(log => {
        const levelMatch = selectedLogLevel.value === 'all' || log.level === selectedLogLevel.value
        const serviceMatch = selectedLogService.value === 'all' || log.service === selectedLogService.value
        return levelMatch && serviceMatch
      })
    })

    // Methods
    const refreshData = async () => {
      isRefreshing.value = true
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update metrics with random variations
      mainMetrics.forEach(metric => {
        const variation = (Math.random() - 0.5) * 10
        metric.currentValue = Math.max(0, Math.min(100, parseFloat(metric.currentValue) + variation)).toFixed(1)
        metric.percentage = parseFloat(metric.currentValue)
        
        // Update status based on thresholds
        if (metric.id === 'cpu' || metric.id === 'memory') {
          if (metric.percentage > 80) metric.status = 'critical'
          else if (metric.percentage > 60) metric.status = 'warning'
          else metric.status = 'healthy'
        }
      })
      
      // Update services
      services.forEach(service => {
        service.cpu = Math.max(0, Math.min(100, service.cpu + (Math.random() - 0.5) * 10))
        service.memory = Math.max(0, Math.min(100, service.memory + (Math.random() - 0.5) * 10))
        service.responseTime = Math.max(50, service.responseTime + (Math.random() - 0.5) * 50)
        
        // Update status
        if (service.cpu > 80 || service.memory > 80 || service.responseTime > 300) {
          service.status = 'critical'
        } else if (service.cpu > 60 || service.memory > 60 || service.responseTime > 200) {
          service.status = 'warning'
        } else {
          service.status = 'healthy'
        }
      })
      
      overallStatus.lastUpdate = new Date()
      isRefreshing.value = false
    }

    const restartService = (service) => {
      if (confirm(`Deseja reiniciar o serviço ${service.name}?`)) {
        alert(`Reiniciando ${service.name}...`)
        // Simulate restart
        service.status = 'restarting'
        setTimeout(() => {
          service.status = 'healthy'
          service.cpu = Math.random() * 30
          service.memory = Math.random() * 50
          service.responseTime = 50 + Math.random() * 100
        }, 3000)
      }
    }

    const viewLogs = (service) => {
      selectedLogService.value = service.id
      // Scroll to logs section
      document.querySelector('.logs-column').scrollIntoView({ behavior: 'smooth' })
    }

    const acknowledgeAlert = (alert) => {
      alert.acknowledged = true
      // In real app, would send to backend
    }

    const resolveAlert = (alert) => {
      const index = activeAlerts.findIndex(a => a.id === alert.id)
      if (index > -1) {
        activeAlerts.splice(index, 1)
      }
    }

    const getStatusLabel = (status) => {
      const labels = {
        healthy: 'Saudável',
        warning: 'Atenção',
        critical: 'Crítico',
        restarting: 'Reiniciando'
      }
      return labels[status] || status
    }

    const formatTime = (date) => {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date)
    }

    const formatNumber = (num) => {
      return new Intl.NumberFormat('pt-BR').format(num)
    }

    const createCharts = () => {
      // Generate sample data for 24 hours
      const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date()
        hour.setHours(hour.getHours() - (23 - i))
        return hour.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      })

      const generateData = (base, variance) => {
        return Array.from({ length: 24 }, () => base + (Math.random() - 0.5) * variance)
      }

      // CPU Chart
      if (charts.cpu) charts.cpu.destroy()
      charts.cpu = new Chart(document.querySelector('[ref="cpuChart"]'), {
        type: 'line',
        data: {
          labels: hours,
          datasets: [{
            label: 'CPU %',
            data: generateData(25, 20),
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100 }
          },
          plugins: {
            legend: { display: false }
          }
        }
      })

      // Memory Chart
      if (charts.memory) charts.memory.destroy()
      charts.memory = new Chart(document.querySelector('[ref="memoryChart"]'), {
        type: 'line',
        data: {
          labels: hours,
          datasets: [{
            label: 'Memory %',
            data: generateData(65, 15),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100 }
          },
          plugins: {
            legend: { display: false }
          }
        }
      })

      // Request Chart
      if (charts.request) charts.request.destroy()
      charts.request = new Chart(document.querySelector('[ref="requestChart"]'), {
        type: 'line',
        data: {
          labels: hours,
          datasets: [{
            label: 'Requests/min',
            data: generateData(1500, 800),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          },
          plugins: {
            legend: { display: false }
          }
        }
      })

      // Response Time Chart
      if (charts.response) charts.response.destroy()
      charts.response = new Chart(document.querySelector('[ref="responseChart"]'), {
        type: 'line',
        data: {
          labels: hours,
          datasets: [{
            label: 'Response Time (ms)',
            data: generateData(150, 100),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          },
          plugins: {
            legend: { display: false }
          }
        }
      })
    }

    const startAutoRefresh = () => {
      if (refreshInterval) clearInterval(refreshInterval)
      if (autoRefresh.value) {
        refreshInterval = setInterval(refreshData, 30000)
      }
    }

    // Lifecycle
    onMounted(() => {
      refreshData()
      setTimeout(createCharts, 100) // Wait for DOM
      startAutoRefresh()
    })

    onUnmounted(() => {
      if (refreshInterval) clearInterval(refreshInterval)
      Object.values(charts).forEach(chart => chart?.destroy())
    })

    // Watch auto refresh
    const watchAutoRefresh = () => {
      startAutoRefresh()
    }

    return {
      isRefreshing,
      autoRefresh,
      selectedLogLevel,
      selectedLogService,
      overallStatus,
      mainMetrics,
      services,
      database,
      redis,
      kafka,
      nginx,
      activeAlerts,
      filteredLogs,
      slaMetrics,
      refreshData,
      restartService,
      viewLogs,
      acknowledgeAlert,
      resolveAlert,
      getStatusLabel,
      formatTime,
      formatNumber,
      watchAutoRefresh
    }
  }
}
</script>

<style scoped>
.system-health-dashboard {
  background: #f8fafc;
  min-height: 100vh;
  padding: 24px;
}

.dashboard-header {
  background: white;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-title {
  font-size: 2rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.header-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.refresh-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1rem;
  transition: transform 0.5s;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.auto-refresh {
  display: flex;
  align-items: center;
}

.auto-refresh-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.auto-refresh-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.auto-refresh-text {
  font-size: 0.875rem;
  color: #374151;
}

.overall-status {
  margin-bottom: 24px;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
}

.status-card.healthy {
  border-left-color: #10b981;
}

.status-card.warning {
  border-left-color: #f59e0b;
}

.status-card.critical {
  border-left-color: #ef4444;
}

.status-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.status-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.status-metrics {
  display: flex;
  gap: 32px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.main-metrics {
  margin-bottom: 32px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
}

.metric-card.healthy {
  border-left-color: #10b981;
}

.metric-card.warning {
  border-left-color: #f59e0b;
}

.metric-card.critical {
  border-left-color: #ef4444;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.metric-info {
  flex: 1;
}

.metric-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.metric-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.metric-value-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.metric-current {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.current-value {
  font-size: 2rem;
  font-weight: 600;
  color: #111827;
}

.current-unit {
  font-size: 1rem;
  color: #6b7280;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
}

.metric-trend.up {
  color: #ef4444;
}

.metric-trend.down {
  color: #10b981;
}

.metric-trend.stable {
  color: #6b7280;
}

.trend-icon {
  font-size: 1rem;
}

.metric-chart {
  height: 60px;
  margin-bottom: 16px;
}

.mini-chart {
  width: 100%;
  height: 100%;
}

.metric-threshold {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.threshold-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.threshold-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.threshold-fill.healthy {
  background: #10b981;
}

.threshold-fill.warning {
  background: #f59e0b;
}

.threshold-fill.critical {
  background: #ef4444;
}

.threshold-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

.services-section,
.infrastructure-section,
.alerts-logs-section,
.performance-section,
.sla-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.service-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
}

.service-card.healthy {
  border-left-color: #10b981;
}

.service-card.warning {
  border-left-color: #f59e0b;
}

.service-card.critical {
  border-left-color: #ef4444;
}

.service-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.service-status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.service-status-indicator.healthy {
  background: #10b981;
}

.service-status-indicator.warning {
  background: #f59e0b;
}

.service-status-indicator.critical {
  background: #ef4444;
}

.service-info {
  flex: 1;
}

.service-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.service-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.service-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  padding: 6px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.restart:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.action-btn.logs:hover {
  border-color: #10b981;
  color: #10b981;
}

.service-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.service-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.metric-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background: #10b981;
  border-radius: 2px;
  transition: width 0.3s;
}

.metric-fill.warning {
  background: #f59e0b;
}

.metric-fill.critical {
  background: #ef4444;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.metric-value.warning {
  color: #f59e0b;
}

.metric-value.critical {
  color: #ef4444;
}

.service-endpoints {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.endpoints-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.endpoints-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.endpoint-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.endpoint-item.healthy {
  background: rgba(16, 185, 129, 0.1);
}

.endpoint-item.warning {
  background: rgba(245, 158, 11, 0.1);
}

.endpoint-method {
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
  color: white;
  min-width: 40px;
  text-align: center;
}

.endpoint-method.get {
  background: #10b981;
}

.endpoint-method.post {
  background: #3b82f6;
}

.endpoint-method.put {
  background: #f59e0b;
}

.endpoint-method.delete {
  background: #ef4444;
}

.endpoint-path {
  flex: 1;
  color: #374151;
}

.endpoint-status {
  color: #6b7280;
}

.infrastructure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.infra-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.infra-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.infra-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.infra-info {
  flex: 1;
}

.infra-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.infra-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.infra-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.infra-status.healthy {
  background: #d1fae5;
  color: #065f46;
}

.infra-status.warning {
  background: #fef3c7;
  color: #92400e;
}

.infra-status.critical {
  background: #fee2e2;
  color: #991b1b;
}

.infra-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.infra-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.alerts-logs-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.alerts-column,
.logs-column {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alerts-list,
.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid;
}

.alert-item.critical {
  background: #fee2e2;
  border-left-color: #ef4444;
}

.alert-item.warning {
  background: #fef3c7;
  border-left-color: #f59e0b;
}

.alert-item.info {
  background: #dbeafe;
  border-left-color: #3b82f6;
}

.alert-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.alert-message {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.alert-meta {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: #6b7280;
}

.alert-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-btn {
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  padding: 4px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.alert-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.alert-btn.ack:hover {
  border-color: #10b981;
  color: #10b981;
}

.alert-btn.resolve:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.logs-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.log-level-select,
.log-service-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
}

.log-item {
  display: grid;
  grid-template-columns: auto auto auto 1fr;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  align-items: center;
}

.log-item.error {
  background: #fee2e2;
}

.log-item.warning {
  background: #fef3c7;
}

.log-item.info {
  background: #dbeafe;
}

.log-item.debug {
  background: #f3f4f6;
}

.log-timestamp {
  color: #6b7280;
  font-family: monospace;
}

.log-level {
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
  color: white;
  text-align: center;
  min-width: 50px;
}

.log-level.error {
  background: #ef4444;
}

.log-level.warning {
  background: #f59e0b;
}

.log-level.info {
  background: #3b82f6;
}

.log-level.debug {
  background: #6b7280;
}

.log-service {
  color: #667eea;
  font-weight: 500;
}

.log-message {
  color: #374151;
  font-family: monospace;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.performance-chart {
  width: 100%;
  height: 200px;
}

.sla-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.sla-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.sla-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sla-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.sla-target {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.sla-value {
  font-size: 2.5rem;
  font-weight: 600;
  color: #10b981;
  margin-bottom: 16px;
}

.sla-value.warning {
  color: #f59e0b;
}

.sla-value.critical {
  color: #ef4444;
}

.sla-periods {
  display: flex;
  justify-content: space-around;
}

.sla-period {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.period-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.period-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

/* Responsividade */
@media (max-width: 768px) {
  .system-health-dashboard {
    padding: 16px;
  }

  .dashboard-header {
    padding: 20px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }

  .service-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .infrastructure-grid {
    grid-template-columns: 1fr;
  }

  .alerts-logs-section {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .sla-grid {
    grid-template-columns: 1fr;
  }

  .log-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .logs-controls {
    flex-direction: column;
  }
}
</style>

