<template>
  <header class="header-kinvo">
    <div class="header-content">
      <div class="logo">agente <b>investidor</b></div>
      <nav class="main-menu">
        <router-link to="/dashboard">Dashboard</router-link>
        <router-link to="/login" class="btn-login">Entrar</router-link>
        <router-link to="/cadastro" class="btn-create">Criar conta</router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
// Header igual ao Kinvo, fundo gradiente
</script>

<style scoped>
.header-kinvo {
  width: 100%;
  background: linear-gradient(120deg, #6c63ff 60%, #00bcd4 100%);
  box-shadow: none;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-content {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 2vw;
}
.logo {
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  text-transform: lowercase;
}
.logo b {
  color: #00bcd4;
  font-weight: 900;
}
.main-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.main-menu a {
  color: #fff;
  font-weight: 500;
  text-decoration: none;
  font-size: 1.1rem;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
}
.main-menu .btn-login {
  background: #f4f6fa;
  color: #6c63ff;
  font-weight: bold;
}
.main-menu .btn-login:hover {
  background: #e0e7ff;
}
.main-menu .btn-create {
  background: #00bcd4;
  color: #fff;
  font-weight: bold;
}
.main-menu .btn-create:hover {
  background: #6c63ff;
  color: #fff;
}
@media (max-width: 900px) {
  .header-content {
    flex-direction: column;
    gap: 0.7rem;
    align-items: flex-start;
  }
}
</style> 