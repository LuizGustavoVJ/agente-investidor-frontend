<template>
  <div class="searchbar-bg">
    <form class="searchbar-form" @submit.prevent="onSearch">
      <input type="text" v-model="query" placeholder="Buscar ativos, índices, fundos de investimentos, relatórios e carteiras recomendadas" @focus="showResults = true" @blur="onBlur" />
      <button type="submit">Pesquisar</button>
    </form>
    <transition name="fade">
      <div v-if="showResults && results.length" class="search-results">
        <div v-for="(item, i) in results" :key="i" class="search-result-item">
          <span class="result-type">{{ item.type }}</span>
          <span class="result-name">{{ item.name }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
const query = ref('')
const showResults = ref(false)
const results = ref([])
const mockData = [
  { type: 'Ação', name: 'PETR4' },
  { type: 'Ação', name: 'VALE3' },
  { type: 'Fundo', name: 'XPTO11' },
  { type: 'Relatório', name: 'Relatório Mensal' },
  { type: 'Carteira', name: 'Carteira Dividendos' },
]
function onSearch() {
  if (query.value.trim()) {
    results.value = mockData.filter(item => item.name.toLowerCase().includes(query.value.toLowerCase()))
    showResults.value = true
  } else {
    results.value = []
    showResults.value = false
  }
}
function onBlur() {
  setTimeout(() => { showResults.value = false }, 150)
}
watch(query, val => {
  if (val.trim()) {
    results.value = mockData.filter(item => item.name.toLowerCase().includes(val.toLowerCase()))
    showResults.value = true
  } else {
    results.value = []
    showResults.value = false
  }
})
</script>

<style scoped>
.searchbar-bg {
  width: 100vw;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(35,41,70,0.04);
  padding: 2rem 0 1.5rem 0;
  position: relative;
}
.searchbar-form {
  width: 100%;
  max-width: 700px;
  display: flex;
  gap: 1rem;
  align-items: center;
}
.searchbar-form input {
  flex: 1;
  padding: 1.1rem 1.2rem;
  border-radius: 8px;
  border: 1.5px solid #e0e0e0;
  font-size: 1.1rem;
  background: #f4f6fa;
  outline: none;
  transition: border 0.2s;
}
.searchbar-form input:focus {
  border: 1.5px solid #6c63ff;
}
.searchbar-form button {
  background: #00bcd4;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  padding: 1.1rem 2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.searchbar-form button:hover {
  background: #6c63ff;
}
.search-results {
  position: absolute;
  top: 4.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 700px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(35,41,70,0.13);
  z-index: 20;
  padding: 0.5rem 0;
  animation: fadeIn 0.18s;
}
.search-result-item {
  padding: 0.7rem 1.2rem;
  display: flex;
  gap: 1.2rem;
  align-items: center;
  border-bottom: 1px solid #f4f6fa;
  font-size: 1.05rem;
  cursor: pointer;
  transition: background 0.15s;
}
.search-result-item:last-child {
  border-bottom: none;
}
.search-result-item:hover {
  background: #f4f6fa;
}
.result-type {
  font-weight: 600;
  color: #6c63ff;
  min-width: 80px;
}
.result-name {
  color: #232946;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.18s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (max-width: 600px) {
  .searchbar-form {
    flex-direction: column;
    gap: 0.7rem;
    max-width: 98vw;
  }
  .searchbar-form button, .searchbar-form input {
    width: 100%;
  }
  .search-results {
    top: 7.5rem;
    max-width: 98vw;
  }
}
</style> 