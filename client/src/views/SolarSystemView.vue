<template>
  <div class="solar-system-page">
    <main class="planets-container">
      <Planet
        v-for="planet in planetData"
        :key="planet.id"
        :planet="planet"
      />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Planet from '../../src/components/Planet.vue'
import { planets } from '../data/planets'

const planetData = ref(planets)
</script>

<style scoped>
.solar-system-page {
  min-height: 100vh;
  background-color: #1a1a2e;
  /* background-image: url('/path/to/your/stars-background.png') Додайте фонове зображення з зірками */
  background-size: cover;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.planets-container {
  display: flex;          
  justify-content: center; 
  align-items: center;
  flex-wrap: wrap; 
  gap: 40px; 
  width: 100%;  
  max-width: 1400px;
}
</style>