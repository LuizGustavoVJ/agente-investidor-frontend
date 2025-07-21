<template>
  <div class="dashboard-bg">
    <div class="dashboard-content">
      <div class="dashboard-header">
        <span class="user-greeting">Olá, Jane</span>
      </div>
      <div class="dashboard-main-grid">
        <div class="dashboard-row">
          <div class="dashboard-card card-main">
            <div class="card-title">Patrimônio Total</div>
            <div class="card-row">
              <span class="card-value">R$ 150.750</span>
              <span class="card-variation positivo">3,75% <span>(+2.050)</span></span>
            </div>
            <div class="card-row card-row-bottom">
              <span class="card-aportes">Aportes <b>R$ 35.000</b></span>
              <span class="card-metas">Metas <b>3</b></span>
            </div>
          </div>
          <div class="dashboard-pie">
            <ul class="pie-legend-vertical">
              <li><span class="dot renda-variavel"></span>Renda Variável <span class="percent">45,0%</span></li>
              <li><span class="dot fundos"></span>Fundos <span class="percent">25,0%</span></li>
              <li><span class="dot renda-fixa"></span>Renda Fixa <span class="percent">20,0%</span></li>
              <li><span class="dot outros"></span>Outros <span class="percent">10,0%</span></li>
            </ul>
            <div class="dashboard-pie-canvas">
              <canvas id="alocacaoAtivos"></canvas>
            </div>
          </div>
        </div>
        <div class="dashboard-row">
          <div class="dashboard-graph">
            <div class="graph-title">Evolução do Patrimônio</div>
            <canvas id="evolucaoPatrimonio"></canvas>
          </div>
          <div class="dashboard-metas">
            <div class="metas-title">Metas</div>
            <div class="meta-item">
              <span>Aposentadoria</span>
              <span class="meta-valor">R$500.000</span>
            </div>
            <div class="meta-progress-bar">
              <div class="meta-progress" :style="{width: '40%'}"></div>
            </div>
            <a href="#" class="meta-link">+Adicionar Meta</a>
          </div>
        </div>
        <div class="dashboard-row">
          <div class="dashboard-table">
            <div class="table-title">Ativos</div>
            <table>
              <thead>
                <tr>
                  <th>Ações</th>
                  <th>Corretora</th>
                  <th>Quantidade</th>
                  <th>Preço Atual</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ativo in ativos" :key="ativo.nome">
                  <td>{{ ativo.nome }}</td>
                  <td>{{ ativo.corretora }}</td>
                  <td>{{ ativo.quantidade }}</td>
                  <td>R$ {{ ativo.preco }}</td>
                  <td>R$ {{ ativo.valor }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="dashboard-row">
          <div class="dashboard-recomendacao">
            <div class="recomendacao-icon">💡</div>
            <div class="recomendacao-content">
              <div class="recomendacao-title">Recomendação da IA</div>
              <div class="recomendacao-desc">Considere investir em ações do setor bancário<br><span class="alerta">Alerta de Oportunidade</span></div>
            </div>
            <button class="btn-aceitar">Aceitar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Chart from 'chart.js/auto'
const ativos = ref([
  { nome: 'Ações (ITSA4)', corretora: 'XP', quantidade: 200, preco: '11,38', valor: '2.276' },
  { nome: 'Fundo Imob. (KNRI11)', corretora: 'BTG', quantidade: 50, preco: '151,80', valor: '7.590' },
  { nome: 'ETF (IVVB11)', corretora: 'Rico', quantidade: 15, preco: '561,10', valor: '8.417' },
  { nome: 'Ações (PETR4)', corretora: 'Clear', quantidade: 100, preco: '32,45', valor: '3.245' },
])
onMounted(() => {
  // Gráfico de pizza - alocação de ativos
  new Chart(document.getElementById('alocacaoAtivos'), {
    type: 'pie',
    data: {
      labels: ['Renda Variável', 'Fundos', 'Renda Fixa', 'Outros'],
      datasets: [{
        data: [45, 25, 20, 10],
        backgroundColor: ['#4a6cf7', '#6cc3ff', '#a3bffa', '#e0e7ff'],
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              let value = context.parsed;
              let total = context.chart._metasets[0].total;
              let percent = ((value / total) * 100).toFixed(1) + '%';
              return `${label}: ${percent}`;
            }
          }
        },
        datalabels: {
          display: true,
          color: '#232946',
          font: { weight: 'bold', size: 16 },
          formatter: (value, ctx) => {
            let total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            let percent = ((value / total) * 100).toFixed(1);
            return percent + '%';
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
    }
  })
  // Gráfico de linha - evolução do patrimônio
  new Chart(document.getElementById('evolucaoPatrimonio'), {
    type: 'line',
    data: {
      labels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set'],
      datasets: [{
        label: 'Evolução',
        data: [75000, 90000, 110000, 130000, 150750],
        borderColor: '#6c63ff',
        backgroundColor: 'rgba(108,99,255,0.00)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: '#6c63ff',
        borderWidth: 2,
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'R$ ' + context.parsed.y.toLocaleString('pt-BR');
            }
          }
        },
        datalabels: {
          display: true,
          color: '#232946',
          font: { weight: 'bold', size: 13 },
          align: 'top',
          formatter: (value) => 'R$ ' + value.toLocaleString('pt-BR')
        }
      },
      scales: {
        y: { beginAtZero: false, grid: { color: '#e0e7ff' }, ticks: { color: '#627179' } },
        x: { grid: { display: false }, ticks: { color: '#627179' } }
      },
      responsive: true,
      maintainAspectRatio: false,
    }
  })
})
</script>

<style scoped>
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
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 1.5rem;
}
.user-greeting {
  color: #232946;
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
}
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
.pie-title {
  color: #232946;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.7rem;
  width: 100%;
}
.pie-legend-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  font-size: 0.98rem;
  color: #232946;
  min-width: 120px;
  justify-content: center;
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
.pie-legend-vertical .fundos { background: #6cc3ff; }
.pie-legend-vertical .renda-fixa { background: #a3bffa; }
.pie-legend-vertical .outros { background: #e0e7ff; }
.pie-legend-vertical .percent {
  color: #627179;
  font-weight: 500;
  margin-left: 0.5rem;
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
.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  font-size: 0.98rem;
  color: #627179;
}
.pie-legend .dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 0.4rem;
}
.pie-legend .renda-variavel { background: #6c63ff; }
.pie-legend .fundos { background: #00bcd4; }
.pie-legend .renda-fixa { background: #3b4cca; }
.pie-legend .outros { background: #e0e7ff; }
.pie-legend-bottom {
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 2.2rem;
  margin-top: 1.2rem;
}
.percent {
  color: #6c63ff;
  font-weight: bold;
  margin-left: 0.3rem;
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
.table-title {
  color: #232946;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.7rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.98rem;
}
th, td {
  padding: 0.6rem 0.5rem;
  text-align: left;
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
.btn-aceitar {
  background: #00bcd4;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-aceitar:hover {
  background: #6c63ff;
}
@media (max-width: 1100px) {
  .dashboard-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  .dashboard-card.card-main, .dashboard-pie, .dashboard-graph, .dashboard-metas {
    min-width: 0;
    width: 100%;
  }
}
@media (max-width: 700px) {
  .dashboard-content {
    padding: 1.2rem 0.5rem;
    gap: 1rem;
  }
  .dashboard-row {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 