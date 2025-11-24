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
        :angle="rocketAngle"
        :is-visible="isRocketVisible"
        :is-landing="isRocketLanding"
        :is-flying="isRocketFlying"
        :is-taking-off="isRocketTakingOff"
        :is-landing-start="isRocketLandingStart"
        :is-shake-increasing="isRocketShakeIncreasing"
        :is-shake-decreasing="isRocketShakeDecreasing"
      />
    </main>

    <!-- Planet Card Component -->
    <PlanetCard
      v-if="selectedPlanetData"
      :planet-data="selectedPlanetData"
      :planet-id="selectedPlanetId"
      :is-visible="isCardVisible"
      @close="closePlanetCard"
      @badge-earned="handleBadgeEarnedWithStella"
      @update-planet-data="handlePlanetDataUpdate"
    />

    <!-- Stella Component -->
    <Stella ref="stella" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch, inject, provide } from 'vue'
import Planet from '../../src/components/Planet.vue'
import PlanetCard from '../../src/components/PlanetCard.vue'
import Rocket from '../../src/components/Rocket.vue'
import Stella from '../../src/components/Stella.vue'
import { planets } from '../data/planets'
import { galaxyConfig } from '../utils/data.js'
import { markPlanetAsVisited, getPlanetData } from '../utils/logic.js'
import { useWindowSize } from '@vueuse/core'
import { playClick, playRocketEngine, stopRocketEngine, fadeRocketEngine } from '../utils/sounds.js'

// Отримуємо starsReady через inject (стан зіркового фону)
const starsReady = inject('starsReady', ref(false))
// Отримуємо функцію обробки отримання бейджа
const handleBadgeEarned = inject('handleBadgeEarned', () => {})

// Обробник отримання бейджа (без діалогу Стели - він буде викликаний після закриття BadgeAchievement)
function handleBadgeEarnedWithStella() {
  handleBadgeEarned()
}

const planetData = ref(planets)

const containerRef = ref(null)
const { width: windowWidth } = useWindowSize()

const selectedPlanetData = ref(null)
const selectedPlanetId = ref(null)
const isCardVisible = ref(false)
const isPageLoaded = ref(false)
const stella = ref(null)

// Provide Stella reference for child components
provide('stella', stella)

// Provide function to call completion dialogue
provide('stellaCompletion', () => {
  if (stella.value) {
    stella.value.speak('completion')
  }
})

// Rocket state
const isRocketVisible = ref(false)
const rocketX = ref(0)
const rocketY = ref(0)
const rocketAngle = ref(0) // у градусах
const currentRocketPlanetId = ref('earth') // id планети, на якій зараз ракета
const isRocketFlying = ref(false)
const isRocketLanding = ref(false)
const isRocketTakingOff = ref(false)
const isRocketLandingStart = ref(false)
const isRocketShakeIncreasing = ref(false)
const isRocketShakeDecreasing = ref(false)
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

// Отримуємо позицію центру планети відносно контейнера в логічних координатах
// Використовуємо offsetLeft/offsetTop, які не враховують CSS transform
function getPlanetPosition(planetId) {
  if (!containerRef.value) return null
  
  const planetContainer = containerRef.value.querySelector(`[data-planet-id="${planetId}"]`)
  if (!planetContainer) return null
  
  // Знаходимо planet-wrapper - це фактичний елемент планети
  const planetWrapper = planetContainer.querySelector('.planet-wrapper')
  if (!planetWrapper) return null
  
  // Використовуємо offsetLeft/offsetTop для отримання координат без урахування CSS transform
  // Це дає нам логічні координати, які не залежать від масштабу
  let x = 0
  let y = 0
  let element = planetContainer
  
  // Накопичуємо offset до контейнера
  while (element && element !== containerRef.value) {
    x += element.offsetLeft
    y += element.offsetTop
    element = element.offsetParent
  }
  
  // Додаємо позицію wrapper всередині container
  // wrapper зазвичай центрований всередині container через flexbox
  x += planetContainer.offsetWidth / 2
  y += planetContainer.offsetHeight / 2
  
  return { x, y }
}

// Обчислюємо відстань посадки на основі розміру планети
function getLandingDistance(planetId) {
  const planet = planets.find(p => p.id === planetId)
  if (!planet) return 50 // Значення за замовчуванням
  
  const baseSize = planet.size || 200
  const visualScale = planet.visualScale || 1
  // Для Сатурна враховуємо множник для кілець
  const saturnMultiplier = planet.id === 'saturn' ? 1.15 : 1
  // Реальний розмір планети (радіус)
  const planetRadius = (baseSize * Math.max(1, visualScale) * saturnMultiplier) / 2
  
  // Відстань посадки = радіус планети + невеликий відступ
  // Мінімальна відстань 15px, масштабується пропорційно розміру
  const baseOffset = 15 // Базовий відступ від поверхні
  const scaledOffset = planetRadius * 0.1 // 10% від радіусу як додатковий відступ
  const landingDistance = planetRadius + baseOffset + scaledOffset
  
  return landingDistance
}

// Позиція "якоря" ракети над планетою в логічних (немасштабованих) координатах
// getPlanetPosition вже повертає логічні координати, тому не ділимо на scaleFactor
function getRocketAnchorPosition(planetId) {
  const planetPos = getPlanetPosition(planetId)
  if (!planetPos) return null

  const landingDistance = getLandingDistance(planetId)
  
  // planetPos вже в логічних координатах, просто віднімаємо відстань посадки
  return {
    x: planetPos.x,
    y: planetPos.y - landingDistance // Відстань посадки в логічних координатах
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
  
  // Якщо картка відкрита, спочатку закриваємо її
  if (isCardVisible.value) {
    isCardVisible.value = false
    selectedPlanetData.value = null
    selectedPlanetId.value = null
    document.body.style.overflow = 'auto'
    // Чекаємо, поки картка закриється перед початком нового польоту
    setTimeout(() => {
      startRocketFlight(planetId)
    }, 350) // Трохи більше, ніж затримка закриття (300ms)
    return
  }
  
  startRocketFlight(planetId)
}

// Відкриття картки планети (викликаємо тільки після завершення польоту)
async function openPlanetCard(planetId) {
  playClick()
  
  // Якщо картка вже відкрита, спочатку закриваємо її
  if (isCardVisible.value) {
    isCardVisible.value = false
    selectedPlanetData.value = null
    selectedPlanetId.value = null
    // Чекаємо, поки попередня картка закриється
    await new Promise(resolve => setTimeout(resolve, 350))
  }
  
  // Спочатку отримуємо базові дані планети без тесту
  const basePlanetData = galaxyConfig[planetId]
  
  if (!basePlanetData) {
    console.error('Planet not found in galaxyConfig for ID:', planetId)
    return
  }
  
  // Встановлюємо базові дані планети одразу (без тесту)
  selectedPlanetId.value = planetId
  selectedPlanetData.value = { ...basePlanetData, quiz: [] }
  
  // Позначаємо планету як відвідану
  markPlanetAsVisited(planetId)
  
  // Показуємо картку ОДРАЗУ (не чекаємо на nextTick)
  isCardVisible.value = true
  
  // Чекаємо, поки Vue оновить DOM (асинхронно, не блокуємо відображення)
  nextTick()
  
  // Блокуємо скрол сторінки під час відкриття картки
  document.body.style.overflow = 'hidden'
  
  // АСИНХРОННО завантажуємо питання в фоні і оновлюємо дані
  getPlanetData(planetId).then((planetInfoWithQuiz) => {
    if (planetInfoWithQuiz && selectedPlanetId.value === planetId) {
      // Оновлюємо дані планети з питанням тільки якщо картка все ще відкрита для цієї планети
      selectedPlanetData.value = planetInfoWithQuiz
    }
  }).catch((error) => {
    console.warn('Failed to load quiz question:', error)
    // Якщо не вдалося завантажити питання, залишаємо картку без тесту
  })
}

function closePlanetCard() {
  isCardVisible.value = false
  
  // Стелла каже про продовження подорожі
  if (stella.value) {
    setTimeout(() => {
      stella.value.speak('continueJourney')
    }, 500)
  }
  
  // Повертаємо скрол після закриття картки
  setTimeout(() => {
    document.body.style.overflow = 'auto'
    // Очищаємо дані тільки якщо картка дійсно закрита і не відкривається нова
    if (!isCardVisible.value) {
      selectedPlanetData.value = null
      selectedPlanetId.value = null
    }
  }, 300) // Затримка для завершення анімації
}

// Обробник оновлення даних планети (наприклад, при генерації нового питання)
function handlePlanetDataUpdate(updatedData) {
  if (selectedPlanetId.value && selectedPlanetData.value) {
    // Оновлюємо дані, створюючи новий об'єкт для реактивності Vue
    selectedPlanetData.value = { ...updatedData }
  }
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

  isRocketFlying.value = false
  isRocketVisible.value = true
  isRocketLanding.value = false
  isRocketTakingOff.value = true
  isRocketLandingStart.value = false
  isRocketShakeIncreasing.value = false
  isRocketShakeDecreasing.value = false

  // ЗАПУСКАЄМО ЗВУК ДВИГУНА ПРИ ЗЛЕТІ
  playRocketEngine()

  // Стелла каже про подорож на початку польоту
  if (stella.value) {
    stella.value.speak('traveling')
  }

  // Градієнтне збільшення трясіння при злеті
  setTimeout(() => {
    isRocketShakeIncreasing.value = true
    setTimeout(() => {
      isRocketTakingOff.value = false
      isRocketShakeIncreasing.value = false
      isRocketFlying.value = true
    }, 300)
  }, 100)

  const finalPos = { ...targetPos }

  const landingDistance = getLandingDistance(targetPlanetId)
  const hoverOffset = landingDistance * 0.2
  const flightTarget = {
    x: targetPos.x,
    y: targetPos.y - hoverOffset
  }

  const duration = 5000
  const distance = Math.hypot(flightTarget.x - startPos.x, flightTarget.y - startPos.y)

  const MIN_PARABOLA_HEIGHT = 60
  const MAX_PARABOLA_HEIGHT = 180
  const dynamicHeight = distance * 0.18
  const parabolaHeight = Math.min(
    MAX_PARABOLA_HEIGHT,
    Math.max(MIN_PARABOLA_HEIGHT, dynamicHeight)
  )

  const startTime = performance.now()
  let prevX = startPos.x
  let prevY = startPos.y

  const animate = (time) => {
    let t = (time - startTime) / duration
    if (t < 0) t = 0
    if (t > 1) t = 1

    // Реалістичний профіль швидкості: спочатку плавне прискорення, потім
    // більш рівномірний рух і наприкінці плавне гальмування (easeInOutCubic).
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2

    const x = startPos.x + (flightTarget.x - startPos.x) * eased
    const baseY = startPos.y + (flightTarget.y - startPos.y) * eased
    const parabolaOffset = -4 * parabolaHeight * eased * (1 - eased)
    const y = baseY + parabolaOffset

    rocketX.value = x
    rocketY.value = y

    // Обчислюємо напрямок руху для нахилу ракети
    const dx = x - prevX
    const dy = y - prevY
    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      // Базовий кут уздовж траєкторії
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90

      // Нормалізуємо до [-180, 180]
      while (angle > 180) angle -= 360
      while (angle < -180) angle += 360

      // Віддзеркалюємо навколо вертикалі, щоб ракета не "дивилась назад",
      // а лише злегка нахилялась вперед/назад у межах [-90, 90].
      if (angle > 90) {
        angle = 180 - angle
      } else if (angle < -90) {
        angle = -180 - angle
      }

      const MAX_TILT_ANGLE = 40
      if (angle > MAX_TILT_ANGLE) {
        angle = MAX_TILT_ANGLE
      } else if (angle < -MAX_TILT_ANGLE) {
        angle = -MAX_TILT_ANGLE
      }

      // На початку траєкторії нахил повільно з'являється,
      // наприкінці — поступово зникає, щоб ракета вирівнялася.
      const appearEnd = 0.25
      const fadeStart = 0.6
      const fadeEnd = 1.0

      let appearFactor = 1
      if (eased <= appearEnd) {
        appearFactor = Math.max(0, eased / appearEnd)
      }

      let fade = 1
      if (eased >= fadeStart) {
        const tFade = Math.min(1, Math.max(0, (eased - fadeStart) / (fadeEnd - fadeStart)))
        fade = 1 - tFade
      }

      const totalFactor = appearFactor * fade
      rocketAngle.value = angle * totalFactor
    }
    prevX = x
    prevY = y

    // 🔊 ПОЧИНАЄМО ЗМЕНШУВАТИ ГУЧНІСТЬ ПРИ НАБЛИЖЕННІ ДО ПОСАДКИ
    if (t >= 0.90 && !isRocketLandingStart.value && isRocketFlying.value) {
      // Плавно зменшуємо гучність на останніх 10% польоту
      fadeRocketEngine(0.5, 500) // До 50% за 500ms
    }

    if (t >= 0.95 && !isRocketLandingStart.value && isRocketFlying.value) {
      isRocketLandingStart.value = true
      isRocketShakeDecreasing.value = false
      setTimeout(() => {
        isRocketShakeDecreasing.value = true
        setTimeout(() => {
          isRocketFlying.value = false
          isRocketShakeDecreasing.value = false
        }, 300)
      }, 100)
    }
    
    if (t < 1) {
      rocketAnimationFrameId = requestAnimationFrame(animate)
    } else {
      rocketAnimationFrameId = null
      startRocketLanding(targetPlanetId, flightTarget, finalPos)
    }
  }

  rocketAnimationFrameId = requestAnimationFrame(animate)
}

// Фаза зависання та посадки: ракета вирівнюється вертикально і повільно опускається
function startRocketLanding(targetPlanetId, hoverPos, finalPos) {
  isRocketLanding.value = false
  isRocketLandingStart.value = true
  isRocketFlying.value = false
  isRocketShakeDecreasing.value = true

  // ДОДАТКОВО ЗМЕНШУЄМО ГУЧНІСТЬ ПІД ЧАС ЗАВИСАННЯ
  fadeRocketEngine(0.3, 500) // До 30% за 500ms

  const hoverDuration = 500
  const landingDuration = 1200

  const startAngle = rocketAngle.value
  const startTime = performance.now()

  const animateLanding = (time) => {
    const elapsed = time - startTime

    if (elapsed <= hoverDuration) {
      // Стадія зависання: позиція фіксована, кут плавно вирівнюється до 0°
      const t = elapsed / hoverDuration
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

      rocketX.value = hoverPos.x
      rocketY.value = hoverPos.y
      rocketAngle.value = startAngle + (0 - startAngle) * eased

      // Завершуємо зменшення трясіння в середині зависання
      if (t >= 0.5 && isRocketShakeDecreasing.value) {
        isRocketShakeDecreasing.value = false
        isRocketLandingStart.value = false
        isRocketLanding.value = true
        
        // 🔊 ЩЕ БІЛЬШЕ ЗМЕНШУЄМО ГУЧНІСТЬ ПІД ЧАС ПОСАДКИ
        fadeRocketEngine(0.1, 600) // До 10% за 600ms
      }

      rocketAnimationFrameId = requestAnimationFrame(animateLanding)
      return
    }

    const landingElapsed = elapsed - hoverDuration

    if (landingElapsed <= landingDuration) {
      // Стадія посадки: вертикальний повільний спуск до фінальної точки
      const t = landingElapsed / landingDuration
      const eased = t * t

      rocketX.value = hoverPos.x
      rocketY.value = hoverPos.y + (finalPos.y - hoverPos.y) * eased
      rocketAngle.value = 0

      rocketAnimationFrameId = requestAnimationFrame(animateLanding)
      return
    }

    // ЗУПИНЯЄМО ЗВУК ДВИГУНА ПІСЛЯ ПОВНОЇ ПОСАДКИ
    stopRocketEngine()

    rocketAnimationFrameId = null
    isRocketFlying.value = false
    isRocketLanding.value = false
    isRocketTakingOff.value = false
    isRocketLandingStart.value = false
    isRocketShakeIncreasing.value = false
    isRocketShakeDecreasing.value = false
    currentRocketPlanetId.value = targetPlanetId

    rocketX.value = finalPos.x
    rocketY.value = finalPos.y
    rocketAngle.value = 0

    // Після завершення посадки з невеликою затримкою відкриваємо картку планети,
    // щоб глядач встиг «побачити посадку».
    setTimeout(() => {
      openPlanetCard(targetPlanetId)
    }, 800)
  }

  rocketAnimationFrameId = requestAnimationFrame(animateLanding)
}

// Ініціалізація ракети на Землі
async function initializeRocket() {
  await nextTick()

  // Додаємо невелику затримку, щоб DOM точно відрендерився
  await new Promise(resolve => setTimeout(resolve, 100))

  const earthPos = getRocketAnchorPosition('earth')
  if (earthPos) {
    rocketX.value = earthPos.x
    rocketY.value = earthPos.y
    rocketAngle.value = 0
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
      // Привітання від Стелли після завантаження
      setTimeout(() => {
        if (stella.value) {
          stella.value.speak('welcome')
        }
      }, 2000)
    }, 200)
  }
}, { immediate: true })

// Оновлюємо позицію ракети при зміні масштабу
watch(scaleFactor, () => {
  if (currentRocketPlanetId.value && !isRocketFlying.value) {
    const pos = getRocketAnchorPosition(currentRocketPlanetId.value)
    if (pos) {
      rocketX.value = pos.x
      rocketY.value = pos.y
    }
  }
})

// Fallback - якщо зірки не готові протягом 8 секунд, показуємо сторінку все одно
onMounted(() => {
  setTimeout(() => {
    if (!starsReady.value) {
      isPageLoaded.value = true
      // Ініціалізуємо ракету на Землі
      nextTick(() => {
        initializeRocket()
      })
      // Привітання від Стелли після завантаження
      setTimeout(() => {
        if (stella.value) {
          stella.value.speak('welcome')
        }
      }, 2000)
    }
  }, 8000)
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