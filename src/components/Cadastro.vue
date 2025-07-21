<template>
  <div class="kinvo-cadastro-bg">
    <div class="kinvo-cadastro-overlay"></div>
    <div class="kinvo-cadastro-container">
      <!-- Lado esquerdo: Imagem de fundo real -->
      <div class="kinvo-cadastro-left-bg">
        <div class="kinvo-chamada-card">
          <h2>Crie sua conta grátis.</h2>
          <p class="kinvo-chamada-desc">
            <b>Você já começa com 14 dias de Premium</b> liberados sem cadastrar nenhum cartão de crédito.
          </p>
        </div>
        <div class="kinvo-logo-bottom-wrapper">
          <img :src="logoZenda" alt="Logo" class="kinvo-logo-left" />
          <p class="kinvo-democratiza"><b>Democratizando o acesso ao investimento.</b></p>
        </div>
      </div>
      <!-- Lado direito: Formulário -->
      <div class="kinvo-cadastro-right">
        <div class="kinvo-form-wrapper">
          <div class="kinvo-form-card">
            <div class="kinvo-form-header">
              <img :src="logoZenda" alt="Logo" class="kinvo-logo-form" />
              <h2>Criar sua conta</h2>
              <router-link to="/login" class="link-alt kinvo-link-login">Já é usuário? Faça seu login.</router-link>
            </div>
            <form @submit.prevent="onRegister">
              <div class="form-row">
                <div class="input-group">
                  <input type="text" v-model="nome" required placeholder="Nome:" />
                </div>
                <div class="input-group">
                  <input type="text" v-model="sobrenome" required placeholder="Sobrenome:" />
                </div>
              </div>
              <div class="form-row">
                <div class="input-group">
                  <input type="text" v-model="cpf" maxlength="14" required @input="formatCPF" placeholder="CPF:" />
                </div>
                <div class="input-group">
                  <input type="text" v-model="celular" maxlength="15" required @input="formatCelular" placeholder="Celular:" />
                </div>
              </div>
              <div class="form-row">
                <div class="input-group">
                  <input type="email" v-model="email" required placeholder="E-mail:" />
                </div>
              </div>
              <div class="form-row">
                <div class="input-group">
                  <input type="date" v-model="dataNascimento" required placeholder="Data de Nascimento:" />
                </div>
              </div>
              <div class="form-row">
                <div class="input-group senha-group">
                  <div class="input-icon-wrapper">
                    <input :type="showSenha ? 'text' : 'password'" v-model="senha" required placeholder="Senha:" />
                    <span class="icon-eye" @click="showSenha = !showSenha">
                      <svg v-if="!showSenha" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#627179" stroke-width="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3" stroke="#627179" stroke-width="2"/></svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#627179" stroke-width="2" d="M17.94 17.94A10.97 10.97 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-6.06M9.53 9.53A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29"/><path stroke="#627179" stroke-width="2" d="m1 1 22 22"/></svg>
                    </span>
                  </div>
                </div>
                <div class="input-group senha-group">
                  <div class="input-icon-wrapper">
                    <input :type="showConfirmarSenha ? 'text' : 'password'" v-model="confirmarSenha" required placeholder="Confirmar senha:" />
                    <span class="icon-eye" @click="showConfirmarSenha = !showConfirmarSenha">
                      <svg v-if="!showConfirmarSenha" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#627179" stroke-width="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3" stroke="#627179" stroke-width="2"/></svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#627179" stroke-width="2" d="M17.94 17.94A10.97 10.97 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-6.06M9.53 9.53A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29"/><path stroke="#627179" stroke-width="2" d="m1 1 22 22"/></svg>
                    </span>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="input-group">
                  <select v-model="valorInvestir" required>
                    <option value="" disabled selected>Valor para investir ou já investido</option>
                    <option>Até R$50.000,00</option>
                    <option>De R$50.000,01 a R$100.000,00</option>
                    <option>De R$100.000,01 a R$300.000,00</option>
                    <option>De R$300.000,01 a R$1.000.000,00</option>
                    <option>Acima de R$1.000.000,00</option>
                    <option>Não tenho capital para investir no momento</option>
                  </select>
                </div>
              </div>
              <div class="switch-group">
                <span>Concordo com a <a href="#" target="_blank">Políticas de Privacidade</a> e os <a href="#" target="_blank">Termos de Uso</a></span>
                <label class="switch">
                  <input type="checkbox" v-model="aceiteTermos" required />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="checkbox-group">
                <input type="checkbox" id="emails" v-model="aceiteEmails" required />
                <label for="emails">
                  Ao compartilhar seus dados, você poderá receber comunicações do sistema com informações e comunicações importantes.
                </label>
              </div>
              <div v-if="erro" class="erro-msg">{{ erro }}</div>
              <div class="form-actions">
                <button type="button" class="btn-voltar" @click="$router.back()">Voltar</button>
                <button type="submit" class="btn-cadastro">Criar conta</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import logoZenda from '../assets/logo-zenda.png'
import graficoCadastro from '../assets/grafico-cadastro.png'
const nome = ref('')
const sobrenome = ref('')
const email = ref('')
const cpf = ref('')
const celular = ref('')
const dataNascimento = ref('')
const valorInvestir = ref('')
const senha = ref('')
const confirmarSenha = ref('')
const aceiteTermos = ref(false)
const aceiteEmails = ref(false)
const erro = ref('')
const showSenha = ref(false)
const showConfirmarSenha = ref(false)

function formatCPF() {
  let v = cpf.value.replace(/\D/g, '').slice(0, 11)
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  cpf.value = v
}
function formatCelular() {
  let v = celular.value.replace(/\D/g, '').slice(0, 11)
  v = v.replace(/(\d{2})(\d)/, '($1) $2')
  v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  celular.value = v
}
function onRegister() {
  erro.value = ''
  if (!aceiteTermos.value) {
    erro.value = 'É necessário aceitar os termos para continuar.'
    return
  }
  if (!aceiteEmails.value) {
    erro.value = 'É necessário aceitar o recebimento de e-mails.'
    return
  }
  if (senha.value !== confirmarSenha.value) {
    erro.value = 'As senhas não coincidem.'
    return
  }
  if (cpf.value.replace(/\D/g, '').length !== 11) {
    erro.value = 'CPF inválido.'
    return
  }
  if (celular.value.replace(/\D/g, '').length < 10) {
    erro.value = 'Celular inválido.'
    return
  }
  if (!dataNascimento.value) {
    erro.value = 'Data de nascimento obrigatória.'
    return
  }
  if (!valorInvestir.value) {
    erro.value = 'Selecione um valor para investir.'
    return
  }
  // Aqui você pode chamar a API real de cadastro
  alert(`Cadastro realizado para: ${email.value}`)
}
</script>

<style scoped>
*, *::before, *::after {
  box-sizing: border-box;
}
html, body, #app {
  height: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}
.kinvo-cadastro-bg {
  min-height: 100vh;
  width: 100vw;
  background: #eef2f4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat', sans-serif;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 0;
}
.kinvo-cadastro-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh;
  background: url('../assets/grafico-cadastro.png') center center/cover no-repeat, #eef2f4;  z-index: 0;
  filter: brightness(0.85);
  pointer-events: none;
}
.kinvo-cadastro-container {
  display: flex;
  flex-direction: row;
  width: 100vw;
  min-height: 100vh;
  max-width: 100vw;
  position: relative;
  z-index: 2;
  background: transparent;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
}
.kinvo-cadastro-left-bg {
  flex: 1.2;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
  padding: 0 60px;
  background: none;
  height: 100vh;
}
.kinvo-chamada-card {
  position: relative;
  z-index: 2;
  background: linear-gradient(90deg, #6c63ff 30%, rgba(108,99,255,0) 100%);
  color: #fff;
  border-radius: 32px;
  padding: 2.8rem 3.2rem 2.5rem 3.2rem;
  max-width: 900px;
  min-width: 700px;
  max-height: 500px;
  min-height: auto;
  margin-top: 50px;
  margin-bottom: 50px;
  margin-right: 60px;
  box-shadow: 0 8px 32px rgba(35,41,70,0.18);
  text-align: left;
  font-size: 1.25rem;
}
.kinvo-chamada-card h2 {
  font-size: 4.3rem;
  font-weight: 700;
  color: #e7a71d;
  margin-bottom: 0.5rem;
  margin-top: 0.7rem;
}
.kinvo-chamada-desc {
  font-size: 2.1rem;
  font-weight: 400;
}
.kinvo-logo-bottom {
  position: relative;
  z-index: 2;
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  text-transform: lowercase;
  margin-top: auto;
  margin-right: 300px;
}
.kinvo-logo-bottom b {
  color: #00bcd4;
  font-weight: 900;
}
.kinvo-democratiza {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  margin-right: 60px;
  text-align: right;
}
.kinvo-cadastro-right {
  flex: 1;
  padding-top: 30px;
  padding-bottom: 30px;
  background: transparent;
}
.kinvo-form-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.kinvo-form-card {
  z-index: 2;
  width: 650px;
  margin: 0 60px 0 40px;
  padding: 32px 36px 40px 36px;
  background-color: #fff;
  border-radius: 20px;
  border: 1px solid #eff1f2;
  display: flex;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
  color: #627179;
  box-shadow: 0 8px 32px rgba(35,41,70,0.13);
  align-items: stretch;
  position: relative;
  font-size: 0.58rem;
}
.kinvo-form-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 0.7rem;
}
.kinvo-form-card h2 {
  color: #1568b6;
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
  margin-top: 0.2rem;
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
  text-align: left;
}
.form-row {
  display: flex;
  gap: 1.2rem;
  width: 100%;
  margin-bottom: 1.2rem;
}
.form-row .input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}
.input-group label {
  font-size: 1rem;
  color: #232946;
  margin-bottom: 0.3rem;
  display: block;
  font-weight: 500;
}
.input-group input,
.input-group select {
  width: 100%;
  padding: 1rem 1.2rem;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  font-size: 0.78rem;
  outline: none;
  transition: border 0.2s;
  font-family: 'Montserrat', sans-serif;
}
.input-group input:focus,
.input-group select:focus {
  border: 1.5px solid #6c63ff;
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
.senha-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.switch-group {
  width: 100%;
  background: #f8f9fa;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.2rem;
  margin-bottom: 1.2rem;
  font-size: 1rem;
  color: #232946;
  font-weight: 500;
}
.switch-group a {
  color: #00bcd4;
  text-decoration: underline;
}
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e0e0e0;
  border-radius: 24px;
  transition: .4s;
}
.switch input:checked + .slider {
  background-color: #3ee0fa;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}
.switch input:checked + .slider:before {
  transform: translateX(20px);
}
.checkbox-group {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-bottom: 1.2rem;
  font-size: 0.98rem;
}
.checkbox-group label {
  color: #232946;
  font-size: 0.98rem;
  line-height: 1.4;
}
.checkbox-group a {
  color: #00bcd4;
  text-decoration: underline;
}
.erro-msg {
  color: #d32f2f;
  background: #ffeaea;
  border-radius: 6px;
  padding: 0.7rem 1rem;
  margin-bottom: 1rem;
  width: 100%;
  text-align: center;
  font-size: 1rem;
}
.form-actions {
  display: flex;
  width: 100%;
  gap: 1.2rem;
  margin-top: 1.2rem;
  justify-content: flex-end;
}
.btn-cadastro {
  flex: 1;
  padding: 1rem;
  background: linear-gradient(90deg, #6c63ff 60%, #00bcd4 100%);
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 2px 8px rgba(35,41,70,0.08);
}
.btn-cadastro:hover {
  background: linear-gradient(90deg, #00bcd4 60%, #6c63ff 100%);
}
.btn-voltar {
  flex: 0 0 120px;
  background: #f4f6fa;
  color: #6c63ff;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(35,41,70,0.04);
}
.btn-voltar:hover {
  background: #e0e7ff;
}
.link-alt {
  margin-top: 0.1rem;
  color: #6c63ff;
  text-decoration: underline;
  font-size: 0.9em;
  display: block;
  text-align: center;
}
.kinvo-link-login {
  margin: 0.2rem 0 0 0;
  font-size: 1.05rem;
  text-align: left;
  color: #6c63ff;
  font-weight: 500;
  text-decoration: underline;
  display: block;
}
.kinvo-logo-form {
  display: block;
  margin: 0 0 0.5rem 0;
  max-width: 120px;
  height: auto;
}
.kinvo-logo-bottom-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 60px;
  margin-top: 0;
}
.kinvo-logo-left {
  max-width: 240px;
  height: auto;
  margin-bottom: 0.1rem;
}
.kinvo-democratiza {
  font-size: 1.3rem;
  font-weight: bold;
  color: #fff;
  margin: 0;
  text-align: left;
}
@media screen and (max-width: 1100px) {
  .kinvo-cadastro-container {
    flex-direction: column;
    min-height: 100vh;
  }
  .kinvo-cadastro-left-bg, .kinvo-cadastro-right {
    width: 100vw;
    height: auto;
    min-height: 320px;
  }
  .kinvo-cadastro-left-bg {
    min-height: 320px;
    padding: 2rem 1rem;
  }
  .kinvo-form-card {
    width: 98vw;
    margin: 32px auto;
    padding: 1.5rem 0.5rem;
    min-width: 0;
    max-width: 100%;
  }
}
@media screen and (max-width: 700px) {
  .kinvo-cadastro-container {
    flex-direction: column;
    min-height: 100vh;
  }
  .kinvo-cadastro-left-bg {
    display: none;
  }
  .kinvo-cadastro-right {
    width: 100vw;
    min-height: 320px;
    padding: 1rem 0.5rem;
  }
  .kinvo-form-card {
    width: 98vw;
    margin: 24px auto;
    padding: 1.2rem 0.5rem;
    min-width: 0;
    max-width: 100%;
  }
}
</style> 