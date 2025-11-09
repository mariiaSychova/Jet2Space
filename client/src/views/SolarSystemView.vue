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
  // Обчислюємо реальну ширину кожної планети з урахуванням visualScale та horizontalMargin
  // У Planet.vue wrapper має розмір size * Math.max(1, visualScale), тому враховуємо це
  const planetsWidth = planets.reduce((sum, planet) => {
    const baseSize = planet.size || 200
    const visualScale = planet.visualScale || 1
    // Wrapper в Planet.vue має розмір baseSize * Math.max(1, visualScale)
    const wrapperSize = baseSize * Math.max(1, visualScale)
    // horizontalMargin додається з обох боків через margin в containerStyle
    const marginWidth = (planet.horizontalMargin || 0) * 2
    // Повна ширина = розмір wrapper + марджини
    return sum + wrapperSize + marginWidth
  }, 0)
  const gapsWidth = (planets.length - 1) * planetGap
  return planetsWidth + gapsWidth
})

const scaleFactor = computed(() => {
  // Збільшуємо паддінг для кращого відображення (більше простору по краях)
  const containerPadding = 160 // Збільшено з 120 до 160 для кращого паддінгу
  const availableWidth = windowWidth.value - containerPadding

  if (availableWidth <= 0) {
    return 0.1 // Мінімальний масштаб навіть для дуже малих екранів
  }

  if (availableWidth >= idealContainerWidth.value) {
    return 1;
  }
  
  // Обчислюємо масштаб так, щоб все помістилося
  const calculatedScale = availableWidth / idealContainerWidth.value
  return Math.max(calculatedScale, 0.2) // Мінімум 20% масштаб
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
  overflow-x: hidden; /* Забороняємо горизонтальний скрол */
  overflow-y: auto;
  /* Додаємо паддінг, щоб планети не були впритик до країв */
  padding: 20px 0;
  box-sizing: border-box;
}

.planets-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 40px;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  padding: 60px 80px; /* Збільшено паддінг по горизонталі з 40px до 80px */
  box-sizing: border-box;
  position: relative;
  z-index: 2;
  transform-origin: center center;
  margin: 0 auto;
}
</style>