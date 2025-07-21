<script setup>
// App.vue limpo, sem layout global
</script>

<template>
  <div class="app-content">
    <router-view />
  </div>
</template>

<style scoped>
.app-content {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
}
/* O layout é definido por cada página/componente */
</style>
