<template>
  <div class="login-bg">
    <div class="login-overlay"></div>
    <div class="login-card-wrapper">
      <div class="login-card">
        <img :src="logoZenda" alt="Logo" class="login-logo" />
        <h2>Entrar no Zenda Web</h2>
        <p class="login-subtitle">Novo usuário? <router-link to="/cadastro" class="login-link">Crie uma conta</router-link></p>
        <form @submit.prevent="onLogin" class="login-form">
          <div class="input-group">
            <input type="email" v-model="email" placeholder="E-mail:" required />
          </div>
          <div class="input-group">
            <div class="input-icon-wrapper">
              <input :type="showSenha ? 'text' : 'password'" v-model="senha" placeholder="Senha:" required />
              <span class="icon-eye" @click="showSenha = !showSenha">
                <svg v-if="!showSenha" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#627179" stroke-width="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3" stroke="#627179" stroke-width="2"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#627179" stroke-width="2" d="M17.94 17.94A10.97 10.97 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-6.06M9.53 9.53A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29"/><path stroke="#627179" stroke-width="2" d="m1 1 22 22"/></svg>
              </span>
            </div>
          </div>
          <div class="login-links-row">
            <router-link to="/esqueci-senha" class="login-link">Esqueci minha senha</router-link>
          </div>
          <button type="submit" class="btn-login">Entrar</button>
        </form>
        <div class="social-login-row">
          <button class="btn-social-icon" @click="loginGoogle" :title="'Entrar com Google'">
            <svg width="36" height="36" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.973 32.083 29.373 35 24 35c-6.065 0-11-4.935-11-11s4.935-11 11-11c2.507 0 4.81.858 6.646 2.278l6.364-6.364C33.527 6.527 28.977 5 24 5 12.954 5 4 13.954 4 25s8.954 20 20 20c11.046 0 20-8.954 20-20 0-1.341-.138-2.651-.389-3.917z"/><path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.1 19.01 13 24 13c2.507 0 4.81.858 6.646 2.278l6.364-6.364C33.527 6.527 28.977 5 24 5c-7.732 0-14.41 4.388-17.694 10.691z"/><path fill="#FBBC05" d="M24 45c5.373 0 10.022-1.833 13.73-4.978l-6.342-5.207C29.373 35 24 35 24 35c-5.373 0-9.973-2.917-11.303-7.083l-6.571 4.819C9.59 40.612 16.268 45 24 45z"/><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303C34.73 32.083 29.373 35 24 35c-5.373 0-9.973-2.917-11.303-7.083l-6.571 4.819C9.59 40.612 16.268 45 24 45c7.732 0 14.41-4.388 17.694-10.691z"/></g></svg>
          </button>
          <button class="btn-social-icon" @click="loginLinkedin" :title="'Entrar com LinkedIn'">
            <svg width="36" height="36" viewBox="0 0 48 48"><g><circle fill="#0077B5" cx="24" cy="24" r="24"/><path fill="#fff" d="M36.5 34h-4.2v-5.6c0-1.3 0-3-1.8-3-1.8 0-2.1 1.4-2.1 2.9V34h-4.2V20h4v1.9h.1c.6-1.1 2-2.1 4-2.1 4.3 0 5.1 2.8 5.1 6.3V34zM15.3 18.1c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zm2.1 15.9h-4.2V20h4.2v14z"/></g></svg>
          </button>
        </div>
        <button class="btn-voltar-home" @click="voltarHome">Voltar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import logoZenda from '../assets/logo-zenda.png'
const email = ref('')
const senha = ref('')
const showSenha = ref(false)
function onLogin() {
  // TODO: Implementar integração real
  alert(`Login: ${email.value}`)
}
function loginGoogle() {
  window.open('https://accounts.google.com/signin', '_blank')
}
function loginLinkedin() {
  window.open('https://www.linkedin.com/oauth/v2/authorization', '_blank')
}
function voltarHome() {
  window.location.href = '/';
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: hidden;
  z-index: 0;
}
.login-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh;
  background: url('../assets/grafico-cadastro.png') center center/cover no-repeat, #eef2f4;
  filter: brightness(0.85);
  z-index: 0;
  pointer-events: none;
}
.login-card-wrapper {
  position: absolute;
  top: 0; right: 0;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 2;
  pointer-events: none;
}
.login-card {
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(35,41,70,0.18);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  min-width: 400px;
  max-width: 500px;
  width: 100%;
  margin-right: 8vw;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
  pointer-events: auto;
}
.login-logo {
  max-width: 120px;
  display: block;
}
.login-card h2 {
  color: #00bcd4;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
  margin-top: 0.2rem;
  text-align: center;
  align-self: start;
}
.login-subtitle {
  text-align: center;
  color: #627179;
  font-size: 0.8rem;
  margin-bottom: 1.2rem;
  align-self: start;
}
.login-link {
  color: #00bcd4;
  text-decoration: underline;
  font-weight: 500;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin-bottom: 1.2rem;
}
.input-group {
  width: 100%;
  margin-bottom: 0;
}
.input-group input {
  width: 100%;
  padding: 1rem 1.2rem;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
  font-size: 0.8rem;
  outline: none;
  transition: border 0.2s;
  box-sizing: border-box;
}
.input-group input:focus {
  border: 1.5px solid #00bcd4;
}
.input-icon-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}
.input-icon-wrapper input {
  padding-right: 2.5rem;
}
.icon-eye {
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.icon-eye:hover {
  opacity: 1;
}
.login-links-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}
.btn-login {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(90deg, #6c63ff 60%, #00bcd4 100%);
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 2px 8px rgba(35,41,70,0.08);
}
.btn-login:hover {
  background: linear-gradient(90deg, #00bcd4 60%, #6c63ff 100%);
}
.social-login-row {
  display: flex;
  flex-direction: row;
  gap: 1.2rem;
  margin-top: 1.5rem;
  align-items: center;
  justify-content: center;
}
.btn-social-icon {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  font-size: 1.5rem;
  box-shadow: 0 2px 8px rgba(35,41,70,0.08);
  position: relative;
  padding: 0;
  overflow: hidden;
}
.btn-social-icon svg {
  width: 36px;
  height: 36px;
  display: block;
  margin: 0 auto;
}
.btn-social-icon:active {
  background: #f0f0f0;
}
.btn-voltar-home {
  margin: 2rem auto 0 auto;
  display: block;
  background: #f4f6fa;
  border: none;
  border-radius: 16px;
  color: #6c63ff;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(35,41,70,0.08);
  padding: 1rem 2.5rem;
  transition: background 0.2s, color 0.2s;
  text-align: center;
}
.btn-voltar-home:hover {
  background: #e0e7ff;
  color: #3d2fd1;
}
@media (max-width: 900px) {
  .login-card-wrapper {
    justify-content: center;
  }
  .login-card {
    margin-right: 0;
  }
}
@media (max-width: 600px) {
  .login-card {
    min-width: 0;
    max-width: 98vw;
    padding: 1.5rem 0.5rem;
  }
}
</style> 