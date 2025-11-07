<template>
  <div class="solar-system-page">
    <main class="planets-container" ref="containerRef" :style="{ transform: `scale(${scaleFactor})` }">
      <Planet
        v-for=" planet in planetData" :key="planet.id" :planet="planet" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Planet from '../../src/components/Planet.vue'
import { planets } from '../data/planets'
import {useWindowSize } from '@vueuse/core'

const planetData = ref(planets)

const containerRef = ref(null)
const { width: windowWidth } = useWindowSize()

const planetGap = 40
const idealContainerWidth = computed(() => {
  const planetsWidth = planets.reduce((sum, planet) => sum + (planet.size || 200), 0)
  const gapsWidth = (planets.length - 1) * planetGap
  return planetsWidth + gapsWidth
})

const scaleFactor = computed(() => {
  const containerPadding = 80
  const availableWidth = windowWidth.value - containerPadding

  if (availableWidth >= idealContainerWidth.value) {
    return 1;
  }
  
  return availableWidth / idealContainerWidth.value
})

</script>

<style scoped>
.solar-system-page {
  min-height: 100vh;
  background-color: #1a1a2e;

  background-image: url();
  background-size: cover; 
  background-position: center center;
  background-repeat: no-repeat; 
  background-attachment: fixed;

  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.planets-container {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 40px;
  width: 100%;
  padding: 40px;
  box-sizing: border-box;
}
</style>