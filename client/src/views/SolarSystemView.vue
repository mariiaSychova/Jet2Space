<template>
  <div class="solar-system-page">
    <main class="planets-container" ref="containerRef" :style="{ transform: `scale(${scaleFactor})` }">
      <Planet
        v-for="planet in planetData" 
        :key="planet.id" 
        :planet="planet"
        @planet-click="openPlanetCard"
      />
    </main>

    <!-- Planet Card Component -->
    <PlanetCard
      v-if="selectedPlanetData"
      :planet-data="selectedPlanetData"
      :planet-id="selectedPlanetId"
      :is-visible="isCardVisible"
      @close="closePlanetCard"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Planet from '../../src/components/Planet.vue'
import PlanetCard from '../../src/components/PlanetCard.vue'
import { planets } from '../data/planets'
import { galaxyConfig } from '../utils/data.js'
import {useWindowSize } from '@vueuse/core'

const planetData = ref(planets)

const containerRef = ref(null)
const { width: windowWidth } = useWindowSize()

const selectedPlanetData = ref(null)
const selectedPlanetId = ref(null)
const isCardVisible = ref(false)

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

function openPlanetCard(planetId) {
  // Знаходимо дані планети з galaxyConfig
  const planetInfo = galaxyConfig[planetId]
  if (planetInfo) {
    selectedPlanetData.value = planetInfo
    selectedPlanetId.value = planetId
    isCardVisible.value = true
    // Блокуємо скрол сторінки під час відкриття картки
    document.body.style.overflow = 'hidden'
  }
}

function closePlanetCard() {
  isCardVisible.value = false
  // Повертаємо скрол після закриття картки
  setTimeout(() => {
    document.body.style.overflow = 'auto'
    selectedPlanetData.value = null
    selectedPlanetId.value = null
  }, 300) // Затримка для завершення анімації
}

</script>

<style scoped>
.solar-system-page {
  min-height: 100vh;
  background: transparent;
  position: relative;
  z-index: 1;

  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.planets-container {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 40px;
  width: 100%;
  padding: 40px;
  box-sizing: border-box;
  position: relative;
  z-index: 2;
}
</style>