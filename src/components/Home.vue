<template>
  <div>
    <Header />
    <Hero />
    <FeatureCards />
    <SearchBar />
    <NewsSection />
    <Footer />
  </div>
</template>

<script setup>
import Header from './Header.vue'
import Hero from './Hero.vue'
import FeatureCards from './FeatureCards.vue'
import SearchBar from './SearchBar.vue'
import NewsSection from './NewsSection.vue'
import Footer from './Footer.vue'
</script>

<style scoped>
/* O layout e as cores estão nos componentes filhos */
</style> 