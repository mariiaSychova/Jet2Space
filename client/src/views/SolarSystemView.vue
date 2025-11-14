<template>
  <div class="solar-system-page" :class="{ 'page-loaded': isPageLoaded }">
    <!-- Gradient fade overlay -->
    <Transition name="fade-gradient">
      <div v-if="!isPageLoaded" class="loading-overlay">
        <div class="gradient-fade"></div>
      </div>
    </Transition>

    <main class="planets-container" ref="containerRef" :class="{ 'loaded': isPageLoaded }" :style="{ transform: `scale(${scaleFactor})` }">
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

    <!-- Stella Component -->
    <Stella ref="stella" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import Planet from '../../src/components/Planet.vue'
import PlanetCard from '../../src/components/PlanetCard.vue'
import Stella from '../../src/components/Stella.vue'
import { planets } from '../data/planets'
import { galaxyConfig } from '../utils/data.js'
import { useWindowSize } from '@vueuse/core'

const planetData = ref(planets)

const containerRef = ref(null)
const { width: windowWidth } = useWindowSize()

const selectedPlanetData = ref(null)
const selectedPlanetId = ref(null)
const isCardVisible = ref(false)
const isPageLoaded = ref(false)
const stella = ref(null)

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

async function openPlanetCard(planetId) {
  console.log('openPlanetCard called with planetId:', planetId)
  
  // Знаходимо дані планети з galaxyConfig
  const planetInfo = galaxyConfig[planetId]
  console.log('planetInfo found:', planetInfo)
  console.log('Available keys in galaxyConfig:', Object.keys(galaxyConfig))
  
  if (!planetInfo) {
    console.error('Planet not found in galaxyConfig for ID:', planetId)
    console.error('Expected one of:', Object.keys(galaxyConfig))
    return
  }
  
  // Встановлюємо дані планети
  selectedPlanetId.value = planetId
  selectedPlanetData.value = planetInfo
  
  // Чекаємо, поки Vue оновить DOM
  await nextTick()
  
  // Після того, як компонент відрендерився, показуємо картку
  isCardVisible.value = true
  
  // Стелла каже про подорож
  if (stella.value) {
    stella.value.speak('traveling')
  }
  
  // Блокуємо скрол сторінки під час відкриття картки
  document.body.style.overflow = 'hidden'
  
  console.log('Card opened for planet:', planetInfo.name)
  console.log('isCardVisible:', isCardVisible.value)
  console.log('selectedPlanetData:', selectedPlanetData.value)
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

// Завантаження сторінки з fade-in ефектом
onMounted(() => {
  // Мінімальна затримка для показу сторінки (щоб градієнт був видимий)
  const minDelay = 600
  // Максимальна затримка (якщо відео завантажуються повільно)
  const maxDelay = 1500
  const startTime = Date.now()
  
  // Перевіряємо готовність відео
  const checkReady = () => {
    const videos = document.querySelectorAll('.planet-video')
    const elapsed = Date.now() - startTime
    
    if (videos.length === 0) {
      // Якщо відео ще не відрендерилися, чекаємо мінімальну затримку
      if (elapsed < minDelay) {
        setTimeout(checkReady, 100)
      } else {
        isPageLoaded.value = true
      }
      return
    }
    
    // Перевіряємо, скільки відео завантажилися
    let readyCount = 0
    videos.forEach((video) => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        readyCount++
      }
    })
    
    const allReady = readyCount >= Math.max(1, videos.length * 0.5) // 50% відео готові
    const minTimePassed = elapsed >= minDelay
    
    // Показуємо сторінку, якщо відео готові або пройшла мінімальна затримка
    // Але не пізніше максимальної затримки
    if ((allReady && minTimePassed) || elapsed >= maxDelay) {
      isPageLoaded.value = true
    } else {
      setTimeout(checkReady, 100)
    }
  }
  
  // Починаємо перевірку після невеликої затримки для рендерингу
  setTimeout(checkReady, 200)
  
  // Привітання від Стелли після завантаження
  setTimeout(() => {
    if (stella.value) {
      stella.value.speak('welcome')
    }
  }, 2000) // Через 2 секунди після завантаження сторінки
})

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
  opacity: 0;
  transition: opacity 1.2s ease-in-out;
}

.planets-container.loaded {
  opacity: 1;
}

/* Loading overlay з градієнтним fade */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  pointer-events: none;
  overflow: hidden;
}

.gradient-fade {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    #0a0a1a 0%,
    #1a1a2e 15%,
    #16213e 30%,
    #0f3460 45%,
    #1a1a3e 60%,
    #0a1a3a 75%,
    #0f1a2e 90%,
    #0a0a1a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 5s ease infinite;
  opacity: 1;
}

/* Анімація градієнта - плавний рух кольорів */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Fade-out анімація для overlay */
.fade-gradient-leave-active {
  transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-gradient-leave-from {
  opacity: 1;
}

.fade-gradient-leave-to {
  opacity: 0;
}
</style>