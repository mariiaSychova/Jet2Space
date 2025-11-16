<template>
  <div class="solar-system-page" :class="{ 'page-loaded': isPageLoaded }">
    <!-- Gradient fade overlay -->
    <Transition name="fade-gradient">
      <div v-if="!isPageLoaded" class="loading-overlay">
        <div class="gradient-fade"></div>
      </div>
    </Transition>

    <main 
      class="planets-container" 
      ref="containerRef" 
      :class="{ 'loaded': isPageLoaded, 'card-open': isCardVisible }" 
      :style="{ transform: `scale(${scaleFactor})` }"
      @mousedown="handleContainerClick"
      @click.stop="handleContainerClick"
    >
      <Planet
        v-for="planet in planetData" 
        :key="planet.id" 
        :planet="planet"
        :is-card-open="isCardVisible"
        @planet-click="handlePlanetClick"
      />
      
      <!-- Rocket Component -->
      <Rocket
        :x="rocketX"
        :y="rocketY"
        :is-visible="isRocketVisible"
      />
    </main>

    <!-- Planet Card Component -->
    <PlanetCard
      v-if="selectedPlanetData"
      :planet-data="selectedPlanetData"
      :planet-id="selectedPlanetId"
      :is-visible="isCardVisible"
      @close="closePlanetCard"
      @badge-earned="handleBadgeEarned"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch, inject } from 'vue'
import Planet from '../../src/components/Planet.vue'
import PlanetCard from '../../src/components/PlanetCard.vue'
import Rocket from '../../src/components/Rocket.vue'
import { planets } from '../data/planets'
import { galaxyConfig } from '../utils/data.js'
import { markPlanetAsVisited } from '../utils/logic.js'
import { useWindowSize } from '@vueuse/core'
import { playClick } from '../utils/sounds.js'

// Отримуємо starsReady через inject
const starsReady = inject('starsReady', ref(false))
// Отримуємо функцію обробки отримання бейджа
const handleBadgeEarned = inject('handleBadgeEarned', () => {})

const planetData = ref(planets)

const containerRef = ref(null)
const { width: windowWidth } = useWindowSize()

const selectedPlanetData = ref(null)
const selectedPlanetId = ref(null)
const isCardVisible = ref(false)
const isPageLoaded = ref(false)

// Rocket state
const isRocketVisible = ref(false)
const rocketX = ref(0)
const rocketY = ref(0)
const currentRocketPlanetId = ref('earth') // id планети, на якій зараз ракета
const isRocketFlying = ref(false)
let rocketAnimationFrameId = null

const planetGap = 60
const idealContainerWidth = computed(() => {
  // Обчислюємо реальну ширину кожної планети з урахуванням visualScale та saturnMultiplier
  // У Planet.vue wrapper має розмір size * Math.max(1, visualScale) * saturnMultiplier
  const planetsWidth = planets.reduce((sum, planet) => {
    const baseSize = planet.size || 200
    const visualScale = planet.visualScale || 1
    // Для Сатурна враховуємо множник для кілець (той самий, що в Planet.vue)
    const saturnMultiplier = planet.id === 'saturn' ? 1.15 : 1
    // Wrapper в Planet.vue має розмір baseSize * Math.max(1, visualScale) * saturnMultiplier
    const wrapperSize = baseSize * Math.max(1, visualScale) * saturnMultiplier
    // horizontalMargin додається з обох боків через margin в containerStyle (якщо є)
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

// Отримуємо позицію центру планети відносно контейнера (враховуючи scale)
function getPlanetPosition(planetId) {
  if (!containerRef.value) return null
  
  const planetContainer = containerRef.value.querySelector(`[data-planet-id="${planetId}"]`)
  if (!planetContainer) return null
  
  // Знаходимо planet-wrapper - це фактичний елемент планети
  const planetWrapper = planetContainer.querySelector('.planet-wrapper')
  if (!planetWrapper) {
    // Якщо wrapper не знайдено, використовуємо сам container
    const containerRect = containerRef.value.getBoundingClientRect()
    const rect = planetContainer.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top
    }
  }
  
  // Отримуємо позиції відносно viewport
  const wrapperRect = planetWrapper.getBoundingClientRect()
  const containerRect = containerRef.value.getBoundingClientRect()
  
  // Обчислюємо центр wrapper відносно контейнера
  // Оскільки обидва елементи всередині масштабованого контейнера,
  // координати з getBoundingClientRect() вже враховують масштаб
  const centerX = wrapperRect.left + wrapperRect.width / 2 - containerRect.left
  const centerY = wrapperRect.top + wrapperRect.height / 2 - containerRect.top
  
  return { x: centerX, y: centerY }
}

// Позиція "якоря" ракети над планетою в логічних (немасштабованих) координатах
function getRocketAnchorPosition(planetId) {
  const planetPos = getPlanetPosition(planetId)
  if (!planetPos) return null

  const safeScale = scaleFactor.value || 1
  return {
    x: planetPos.x / safeScale,
    y: (planetPos.y - 80) / safeScale // 80px вище центру планети
  }
}

// Обробка кліку на контейнер для обчислення координат
function handleContainerClick(event) {
  // Зупиняємо подію, якщо клік був на планеті (вони обробляють свій клік)
  if (event.target.closest('.planet-container')) {
    return
  }
  
  // Якщо картка відкрита, не обробляємо кліки
  if (isCardVisible.value) {
    return
  }
  
  if (!containerRef.value) {
    console.warn('⚠️ Container ref not available')
    return
  }
  
  const containerRect = containerRef.value.getBoundingClientRect()
  
  // Обчислюємо координати кліку відносно контейнера
  const x = event.clientX - containerRect.left
  const y = event.clientY - containerRect.top
  
  // Тут можна при потребі тимчасово логувати координати кліку
}

// Обробка кліку на планету
function handlePlanetClick(planetId) {
  // Під час польоту ігноруємо нові кліки
  if (isRocketFlying.value) return
  startRocketFlight(planetId)
}

// Відкриття картки планети (викликаємо тільки після завершення польоту)
async function openPlanetCard(planetId) {
  playClick()
  
  // Знаходимо дані планети з galaxyConfig
  const planetInfo = galaxyConfig[planetId]
  
  if (!planetInfo) {
    console.error('Planet not found in galaxyConfig for ID:', planetId)
    return
  }
  
  // Встановлюємо дані планети
  selectedPlanetId.value = planetId
  selectedPlanetData.value = planetInfo
  
  // Позначаємо планету як відвідану
  markPlanetAsVisited(planetId)
  
  // Чекаємо, поки Vue оновить DOM
  await nextTick()
  
  // Після того, як компонент відрендерився, показуємо картку
  isCardVisible.value = true
  
  // Блокуємо скрол сторінки під час відкриття картки
  document.body.style.overflow = 'hidden'
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

// Анімація польоту ракети між двома планетами з параболічною траєкторією
function startRocketFlight(targetPlanetId) {
  const startPos = getRocketAnchorPosition(currentRocketPlanetId.value)
  const targetPos = getRocketAnchorPosition(targetPlanetId)

  if (!startPos || !targetPos) return

  // Якщо клікаємо на ту ж саму планету – просто відкриваємо картку без польоту
  if (
    currentRocketPlanetId.value === targetPlanetId &&
    Math.abs(startPos.x - targetPos.x) < 0.5 &&
    Math.abs(startPos.y - targetPos.y) < 0.5
  ) {
    openPlanetCard(targetPlanetId)
    return
  }

  // Скасовуємо попередню анімацію, якщо була
  if (rocketAnimationFrameId !== null) {
    cancelAnimationFrame(rocketAnimationFrameId)
    rocketAnimationFrameId = null
  }

  isRocketFlying.value = true
  isRocketVisible.value = true

  const duration = 1600 // тривалість польоту в мс
  const distance = Math.hypot(targetPos.x - startPos.x, targetPos.y - startPos.y)
  const parabolaHeight = distance * 0.25

  const startTime = performance.now()

  const animate = (time) => {
    let t = (time - startTime) / duration
    if (t < 0) t = 0
    if (t > 1) t = 1

    // Легке ease-in-out, щоб старт/приземлення були плавні
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const x = startPos.x + (targetPos.x - startPos.x) * eased

    const baseY = startPos.y + (targetPos.y - startPos.y) * eased
    const parabolaOffset = -4 * parabolaHeight * eased * (1 - eased)
    const y = baseY + parabolaOffset

    rocketX.value = x
    rocketY.value = y

    if (t < 1) {
      rocketAnimationFrameId = requestAnimationFrame(animate)
    } else {
      rocketAnimationFrameId = null
      isRocketFlying.value = false
      currentRocketPlanetId.value = targetPlanetId

      // Гарантуємо точну фінальну позицію
      rocketX.value = targetPos.x
      rocketY.value = targetPos.y

      // Після завершення польоту відкриваємо картку планети
      openPlanetCard(targetPlanetId)
    }
  }

  rocketAnimationFrameId = requestAnimationFrame(animate)
}

// Ініціалізація ракети на Землі
async function initializeRocket() {
  await nextTick()
  
  // Додаємо невелику затримку, щоб DOM точно відрендерився
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Діагностика: перевіряємо всі планети
  const earthPos = getRocketAnchorPosition('earth')
  if (earthPos) {
    rocketX.value = earthPos.x
    rocketY.value = earthPos.y
    currentRocketPlanetId.value = 'earth'
    isRocketVisible.value = true
  } else {
    console.warn('⚠️ Could not find Earth position')
  }
}

// Завантаження сторінки - чекаємо поки зірки будуть готові
watch(starsReady, (ready) => {
  if (ready) {
    // Після того, як зірки готові, показуємо сторінку з невеликою затримкою
    setTimeout(() => {
      isPageLoaded.value = true
      // Ініціалізуємо ракету на Землі
      nextTick(() => {
        initializeRocket()
      })
    }, 200)
  }
}, { immediate: true })

// Fallback - якщо зірки не готові протягом 8 секунд, показуємо сторінку все одно
onMounted(() => {
  setTimeout(() => {
    if (!starsReady.value) {
      isPageLoaded.value = true
      // Ініціалізуємо ракету на Землі
      nextTick(() => {
        initializeRocket()
      })
    }
  }, 8000)
  
  // Додаємо глобальний обробник кліку для діагностики (Ctrl+Click)
  // Глобальний діагностичний обробник Ctrl+Click більше не потрібен
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
  gap: 60px;
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

/* Зменшуємо opacity планет коли картка відкрита для кращого фокусу */
.planets-container.card-open {
  opacity: 0.3;
  transition: opacity 0.3s ease;
  pointer-events: none;
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