<template>
  <section class="news-section">
    <h2><svg width="28" height="28" fill="none" viewBox="0 0 28 28" style="vertical-align:middle;margin-right:8px;"><rect width="28" height="28" rx="6" fill="#6c63ff"/><path d="M8 10h12M8 14h12M8 18h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>Principais notícias do mercado</h2>
    <transition-group name="fade" tag="div" class="news-cards">
      <div class="news-card" v-for="(item, i) in news" :key="item.title">
        <div class="news-title">{{ item.title }}</div>
        <div class="news-desc">{{ item.desc }}</div>
      </div>
    </transition-group>
  </section>
</template>

<script setup>
import { ref } from 'vue'
const news = ref([
  { title: 'Bitcoin recobra fôlego próximo dos US$ 120 mil', desc: 'O bitcoin (BTC) voltou a subir, impulsionando o mercado global de criptomoedas.' },
  { title: 'Selic permanece em 10,5% ao ano', desc: 'O Banco Central manteve a taxa básica de juros, surpreendendo o mercado.' },
  { title: 'Dividendos: veja as melhores ações do mês', desc: 'Analistas destacam papéis com maior potencial de distribuição de lucros.' },
  { title: 'Ibovespa fecha em alta impulsionado por bancos', desc: 'O Ibovespa subiu 1,2% puxado por ações do setor financeiro.' },
])
// Futuro: trocar news.value por dados de API
</script>

<style scoped>
.news-section {
  width: 100vw;
  background: #f4f6fa;
  padding: 2.5rem 0 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.news-section h2 {
  color: #232946;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 2rem;
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
  display: flex;
  align-items: center;
}
.news-cards {
  width: 100%;
  max-width: 1200px;
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}
.news-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(35,41,70,0.04);
  padding: 1.5rem 1.2rem;
  min-width: 220px;
  max-width: 260px;
  flex: 1 1 220px;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  transition: transform 0.18s, box-shadow 0.18s;
  cursor: pointer;
}
.news-card:hover {
  transform: translateY(-5px) scale(1.03);
  box-shadow: 0 8px 32px rgba(35,41,70,0.13);
}
.news-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #6c63ff;
  margin-bottom: 0.5rem;
}
.news-desc {
  color: #232946;
  font-size: 0.98rem;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.18s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
@media (max-width: 900px) {
  .news-cards {
    gap: 1rem;
  }
}
@media (max-width: 600px) {
  .news-cards {
    flex-direction: column;
    gap: 1rem;
    max-width: 98vw;
  }
  .news-card {
    max-width: 98vw;
  }
}
</style> 