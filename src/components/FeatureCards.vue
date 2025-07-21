<template>
  <section class="features-kinvo">
    <div class="feature-card card-roxo">
      <div class="icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#fff"/><path d="M8 24V22C8 19.7909 9.79086 18 12 18H20C22.2091 18 24 19.7909 24 22V24" stroke="#6c63ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="12" r="4" stroke="#6c63ff" stroke-width="2"/></svg>
      </div>
      <div class="title">Simulador de investimentos</div>
      <div class="desc">Descubra investimentos ideais para seu perfil e objetivos financeiros agora.</div>
      <div class="arrow">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
    <div class="feature-card card-roxo2">
      <div class="icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="6" y="14" width="20" height="4" rx="2" fill="#fff"/><rect x="14" y="6" width="4" height="20" rx="2" fill="#6c63ff"/></svg>
      </div>
      <div class="title">Comparador de ativos</div>
      <div class="desc">Compare ativos com facilidade e faça escolhas embasadas com nosso comparador.</div>
      <div class="arrow">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
    <div class="feature-card card-azul">
      <div class="icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="16" rx="4" fill="#fff"/><path d="M16 12v8M16 20l-4-4m4 4l4-4" stroke="#3b4cca" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="title">Carteiras recomendadas</div>
      <div class="desc">Descubra carteiras recomendadas para alavancar seus investimentos eficazmente.</div>
      <div class="arrow">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
    <div class="feature-card card-ciano">
      <div class="icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#fff"/><path d="M10 22V10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12" stroke="#00bcd4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="title">Relatórios e análises</div>
      <div class="desc">Relatórios detalhados e análises precisas para redirecionar seus investimentos.</div>
      <div class="arrow">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
    <div class="feature-card card-ciano2">
      <div class="icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="16" rx="8" fill="#00d4b3"/><path d="M16 12v8M16 20l-4-4m4 4l4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="title">Portabilidade de previdência</div>
      <div class="desc">Veja se você está perdendo dinheiro e conheça as melhores oportunidades.</div>
      <div class="arrow">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
  </section>
</template>

<script setup>
// Cards de funcionalidades igual ao Kinvo, agora com SVGs reais e animação
</script>

<style scoped>
.features-kinvo {
  width: 100%;
  max-width: 100%; /* Alterado de 1400px para 100% */
  margin: 2.5rem auto 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  padding: 0 2vw 2rem 2vw; /* Reduzido padding lateral */
}
.feature-card {
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(35,41,70,0.07);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  min-width: 220px;
  max-width: 260px;
  flex: 1 1 220px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  color: #fff;
  font-weight: 500;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.feature-card:hover {
  transform: translateY(-6px) scale(1.04);
  box-shadow: 0 8px 32px rgba(35,41,70,0.18);
}
.card-roxo {
  background: #6c63ff;
}
.card-roxo2 {
  background: #7c6fff;
}
.card-azul {
  background: #3b4cca;
}
.card-ciano {
  background: #00bcd4;
}
.card-ciano2 {
  background: #00d4b3;
}
.icon {
  font-size: 2.2rem;
  margin-bottom: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title {
  font-size: 1.15rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.desc {
  font-size: 0.98rem;
  margin-bottom: 1.2rem;
}
.arrow {
  position: absolute;
  right: 1.2rem;
  bottom: 1.2rem;
  font-size: 1.5rem;
  color: #fff;
  opacity: 0.7;
  display: flex;
  align-items: center;
}
@media (max-width: 900px) {
  .features-kinvo {
    gap: 1rem;
    padding: 0 2vw 2rem 2vw;
  }
}
@media (max-width: 600px) {
  .features-kinvo {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1vw 1rem 1vw;
  }
  .feature-card {
    max-width: 98vw;
  }
}
</style> 