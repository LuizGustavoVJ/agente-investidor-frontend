<template>
  <section class="hero-kinvo">
    <div class="hero-content">
      <div class="hero-left">
        <h1>Invista melhor.<br />Seu próximo passo é usar o <span>Kairo´s</span>.</h1>
        <form class="email-form" @submit.prevent>
          <input type="email" placeholder="Digite seu e-mail" />
          <button type="submit">Criar sua conta</button>
        </form>
        <p class="trial-info">Comece com <b>14 dias grátis</b> sem cartão de crédito.</p>
      </div>
      <div class="hero-right">
        <div class="mockup-phone">
          <div class="mockup-content">
            <div class="mockup-chart">[Gráfico de Pizza]</div>
            <div class="mockup-value">R$ 120.000,00</div>
            <div class="mockup-label">Carteira 103% do CDI</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Hero igual ao Kinvo
</script>

<style scoped>
.hero-kinvo {
  width: 100%; /* Alterado de 100vw para 100% */
  background: linear-gradient(120deg, #6c63ff 60%, #00bcd4 100%);
  border-radius: 0 0 40px 40px;
  box-shadow: 0 8px 32px rgba(35,41,70,0.08);
  padding-bottom: 2rem;
}
.hero-content {
  max-width: 100%; /* Alterado de 1400px para 100% */
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  padding: 2.5rem 2vw 0 2vw; /* Reduzido padding lateral */
}
.hero-left {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
  padding-top: 2vw;
}
.hero-left h1 {
  font-size: 2.7rem;
  font-weight: 700;
  margin-bottom: 2rem;
  line-height: 1.2;
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
}
.hero-left h1 span {
  color: #00bcd4;
}
.email-form {
  display: flex;
  gap: 0.7rem;
  margin-bottom: 1.2rem;
}
.email-form input {
  padding: 1rem 1.2rem;
  border-radius: 8px;
  border: none;
  font-size: 1.1rem;
  min-width: 220px;
  outline: none;
}
.email-form button {
  background: #00bcd4;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  padding: 1rem 2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.email-form button:hover {
  background: #6c63ff;
}
.trial-info {
  color: #fff;
  font-size: 1.05rem;
  margin-top: 0.5rem;
}
.hero-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 320px;
}
.mockup-phone {
  width: 320px;
  height: 600px;
  background: #fff;
  border-radius: 36px;
  box-shadow: 0 8px 32px rgba(35,41,70,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.mockup-content {
  width: 90%;
  height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
}
.mockup-chart {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #00bcd4 60%, #6c63ff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}
.mockup-value {
  font-size: 2.1rem;
  font-weight: bold;
  color: #6c63ff;
}
.mockup-label {
  color: #00bcd4;
  font-size: 1.1rem;
  font-weight: 500;
}
@media (max-width: 900px) {
  .hero-content {
    flex-direction: column;
    align-items: center;
    padding: 2rem 2vw 0 2vw;
    border-radius: 0 0 24px 24px;
  }
  .hero-left, .hero-right {
    width: 100%;
    min-width: 0;
    padding: 0;
    justify-content: center;
    align-items: center;
  }
  .mockup-phone {
    margin-top: 2rem;
  }
}
@media (max-width: 600px) {
  .hero-content {
    padding: 1rem 1vw 0 1vw;
  }
  .mockup-phone {
    width: 98vw;
    height: 340px;
    min-width: 0;
    border-radius: 18px;
  }
  .mockup-chart {
    width: 100px;
    height: 100px;
    font-size: 0.9rem;
  }
}
</style> 