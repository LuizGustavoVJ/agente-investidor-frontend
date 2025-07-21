<template>
  <div class="error-bg">
    <div class="error-content">
      <svg width="120" height="120" fill="none" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#f4f6fa"/><path d="M40 80c0-11 9-20 20-20s20 9 20 20" stroke="#ff5252" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="55" r="5" fill="#ff5252"/><circle cx="70" cy="55" r="5" fill="#ff5252"/></svg>
      <h1>500</h1>
      <p>Ocorreu um erro inesperado.<br>Por favor, tente novamente ou volte para a Home.</p>
      <router-link to="/" class="btn-home">Voltar para Home</router-link>
    </div>
  </div>
</template>

<script setup>
// Página de erro 500 premium
</script>

<style scoped>
.error-bg {
  min-height: 100vh;
  background: #f4f6fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.error-content {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(35,41,70,0.07);
  padding: 3rem 2.5rem 2.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
h1 {
  font-size: 3rem;
  color: #ff5252;
  margin: 1.2rem 0 0.5rem 0;
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
}
p {
  color: #232946;
  font-size: 1.15rem;
  margin-bottom: 2rem;
}
.btn-home {
  background: #ff5252;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  padding: 1rem 2.2rem;
  text-decoration: none;
  transition: background 0.2s;
}
.btn-home:hover {
  background: #6c63ff;
}
</style> 