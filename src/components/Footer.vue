<template>
  <footer class="footer-kinvo">
    <div class="footer-content">
      <span>© 2025 Agente Investidor</span>
      <nav>
        <a href="#">Termos de Uso</a>
        <a href="#">Política de Privacidade</a>
      </nav>
    </div>
  </footer>
</template>

<script setup>
// Footer igual ao Kinvo
</script>

<style scoped>
.footer-kinvo {
  width: 100%; /* Alterado de 100vw para 100% */
  background: #f4f6fa;
  color: #232946;
  padding: 1.2rem 4vw;
  box-shadow: 0 -2px 8px rgba(35,41,70,0.04);
  display: flex;
  justify-content: center;
  align-items: center;
  position: static; /* Removido relative para evitar conflitos */
  bottom: 0;
  left: 0;
  margin-top: auto;
}
.footer-content {
  width: 100%;
  max-width: 1400px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
}
.footer-content nav {
  display: flex;
  gap: 1.5rem;
}
.footer-content a {
  color: #232946;
  text-decoration: underline;
  font-size: 1rem;
}
@media (max-width: 900px) {
  .footer-content {
    flex-direction: column;
    gap: 0.7rem;
    align-items: flex-start;
  }
}
</style> 