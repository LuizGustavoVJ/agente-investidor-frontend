<template>
  <div class="spinner-bg">
    <div class="spinner"></div>
  </div>
</template>

<script setup>
// Spinner animado
</script>

<style scoped>
.spinner-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 120px;
}
.spinner {
  width: 48px;
  height: 48px;
  border: 5px solid #f4f6fa;
  border-top: 5px solid #6c63ff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 