<template>
  <div class="layout">
    <div class="main-content">
      <header class="header">
        <div class="header-title">Painel do Investidor</div>
        <div class="profile" @click="toggleMenu">
          <span class="profile-avatar">{{ usuario.nome.charAt(0) }}</span>
          <span class="profile-name">{{ usuario.nome }}</span>
          <div v-if="showMenu" class="profile-menu">
            <button @click.stop="logout">Logout</button>
          </div>
        </div>
      </header>
      <section class="content">
        <router-view />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const usuario = ref({ nome: 'Jane' })
const showMenu = ref(false)
function logout() {
  // Aqui você pode limpar o token/autenticação e redirecionar
  window.location.href = '/login'
}
function toggleMenu() {
  showMenu.value = !showMenu.value
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  background: #f4f6fa;
}
.sidebar {
  width: 250px;
  min-width: 220px;
  background: #232946cc;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem 1rem 1rem 1rem;
  box-shadow: 2px 0 8px rgba(0,0,0,0.03);
  height: 100vh;
}
.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: #ffd700;
  letter-spacing: 1px;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.sidebar nav a {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}
.sidebar nav a.router-link-exact-active,
.sidebar nav a.router-link-active {
  background: #ffd700;
  color: #232946;
}
.sidebar-footer {
  margin-top: 2rem;
  font-size: 0.85rem;
  color: #bbb;
  text-align: center;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100vh;
  background: transparent;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 1.2rem 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.header-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #232946;
}
.profile {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  position: relative;
  cursor: pointer;
}
.profile-avatar {
  background: #ffd700;
  color: #232946;
  font-weight: bold;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.profile-name {
  color: #232946;
  font-weight: 500;
}
.profile-menu {
  position: absolute;
  top: 120%;
  right: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(35,41,70,0.08);
  padding: 0.7rem 1.2rem;
  z-index: 10;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.profile-menu button {
  background: none;
  border: none;
  color: #6c63ff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.3rem 0;
  text-align: left;
  width: 100%;
  transition: color 0.2s;
}
.profile-menu button:hover {
  color: #00bcd4;
}
.content {
  flex: 1;
  padding: 2.5rem 2rem;
  background: transparent;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
}
</style> 