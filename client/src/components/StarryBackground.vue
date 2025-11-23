<template>
  <div class="starry-background">
    <!-- Статичні зірки через CSS градієнти (дуже швидко) -->
    <div class="stars-layer" :style="{ backgroundImage: starPattern }"></div>
    
    <!-- Тільки невелика кількість анімованих зірок для ефекту -->
    <div 
      v-for="star in animatedStars" 
      :key="'star-' + star.id"
      class="animated-star"
      :style="{
        left: star.x + '%',
        top: star.y + '%',
        width: star.size + 'px',
        height: star.size + 'px',
        animationDelay: star.delay + 's',
        animationDuration: star.duration + 's'
      }"
    ></div>
    
    <!-- Зменшена кількість туманностей (2 замість 6) -->
    <div 
      v-for="nebula in nebulae" 
      :key="'nebula-' + nebula.id"
      class="nebula"
      :style="{
        left: nebula.x + '%',
        top: nebula.y + '%',
        width: nebula.width + 'px',
        height: nebula.height + 'px',
        animationDuration: nebula.duration + 's',
        animationDelay: nebula.delay + 's'
      }"
    ></div>
    
    <!-- Комети -->
    <div 
      v-for="(comet, index) in comets" 
      :key="'comet-' + index + '-' + comet.animationName"
      class="comet"
      :style="{
        '--comet-angle': comet.angle + 'deg',
        left: comet.startX + '%',
        top: comet.startY + '%',
        animation: `${comet.animationName} ${comet.duration}s linear ${comet.delay + 5.2}s forwards`
      }"
      @animationend="onCometAnimationEnd(index)"
    >
      <div class="comet-head"></div>
      <div class="comet-tail">
        <div class="comet-flame comet-flame-main"></div>
        <div class="comet-flame comet-flame-tip"></div>
        <div class="comet-spark comet-spark-1"></div>
        <div class="comet-spark comet-spark-2"></div>
        <div class="comet-spark comet-spark-3"></div>
      </div>
    </div>
    
    <!-- Зірочки для комет (перед появою та зникненням) -->
    <div 
      v-for="(comet, index) in comets" 
      :key="'comet-star-start-' + index + '-' + comet.animationName"
      class="comet-star comet-star-start"
      :style="{
        left: comet.startX + '%',
        top: comet.startY + '%',
        '--star-delay': (comet.delay + 2.5) + 's'
      }"
    ></div>
    <div 
      v-for="(comet, index) in comets" 
      :key="'comet-star-end-' + index + '-' + comet.animationName"
      class="comet-star comet-star-end"
      :style="{
        left: comet.endX + '%',
        top: comet.endY + '%',
        '--star-delay': (comet.delay + 5.2 + comet.duration) + 's'
      }"
    ></div>
    
    <!-- Менше астероїдів (4 замість 12) -->
    <div 
      v-for="asteroid in asteroids" 
      :key="'asteroid-' + asteroid.id"
      class="asteroid"
      :style="{
        left: asteroid.startX + '%',
        top: asteroid.startY + '%',
        width: asteroid.size + 'px',
        height: asteroid.size + 'px',
        animationDuration: asteroid.duration + 's',
        animationDelay: asteroid.delay + 's',
        '--asteroid-translate-x': (asteroid.endX - asteroid.startX) + '%',
        '--asteroid-translate-y': (asteroid.endY - asteroid.startY) + '%',
        '--asteroid-rotation': asteroid.rotation + 'deg'
      }"
    ></div>
    
    <!-- Менше далеких планет (1 замість 3) -->
    <div 
      v-for="planet in distantPlanets" 
      :key="'planet-' + planet.id"
      class="distant-planet"
      :style="{
        left: planet.x + '%',
        top: planet.y + '%',
        width: planet.size + 'px',
        height: planet.size + 'px',
        animationDuration: planet.duration + 's',
        animationDelay: planet.delay + 's'
      }"
    ></div>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getCachedStars, getCachedAnimatedStars } from '../utils/starBackground.js'

// Emit події про готовність рендерингу
const emit = defineEmits(['stars-ready'])

// Використовуємо кешовані зірки з градієнтами (дуже швидко)
const starPattern = computed(() => getCachedStars())

// Тільки невелика кількість анімованих зірок (20 замість 250)
const animatedStars = ref(getCachedAnimatedStars())

const nebulae = ref([])
const comets = ref([])
const asteroids = ref([])
const distantPlanets = ref([])

// Функція для генерації туманності (зменшена кількість)
function generateNebula(id) {
  // Використовуємо детерміністичні позиції для кешування
  const positions = [
    { x: 20, y: 30 },
    { x: 70, y: 60 },
  ]
  const pos = positions[id % positions.length]
  return {
    id: id,
    x: pos.x,
    y: pos.y,
    width: 400,
    height: 400,
    duration: 40,
    delay: id * 5,
  }
}

// Функція для генерації комети
function generateComet(id) {
  // Генеруємо рандомну початкову точку в межах екрану (10% до 90% для безпеки)
  const startX = Math.random() * 80 + 10 // Між 10% і 90%
  const startY = Math.random() * 80 + 10 // Між 10% і 90%
  
  // Вибираємо один з діагональних напрямків (45°, 135°, 225°, 315°)
  const diagonalAngles = [45, 135, 225, 315]
  const baseAngle = diagonalAngles[Math.floor(Math.random() * diagonalAngles.length)]
  // Додаємо невелику варіацію (±10 градусів) для більшої природності
  const angle = baseAngle + (Math.random() * 20 - 10)
  
  // Відстань польоту (від 20% до 40% екрана для помітного руху в межах екрану)
  const distance = Math.random() * 20 + 20
  
  // Обчислюємо кінцеву точку
  const angleRad = angle * Math.PI / 180
  let endX = startX + Math.cos(angleRad) * distance
  let endY = startY + Math.sin(angleRad) * distance
  
  // Обмежуємо кінцеву точку в межах екрану (5% до 95% для безпеки)
  endX = Math.max(5, Math.min(endX, 95))
  endY = Math.max(5, Math.min(endY, 95))
  
  // Тривалість польоту (від 5 до 7 секунд для повільного руху)
  const duration = Math.random() * 2 + 5
  
  // Затримка для появи (0 для першої комети, 0 для регенерованих)
  const delay = 0
  
  // Створюємо унікальне ім'я анімації для цієї комети
  const animationName = `cometMove-${String(id).replace(/[^a-zA-Z0-9]/g, '-')}`
  
  // Обчислюємо зміщення на 8 пікселів в напрямку руху
  // Для viewport шириною ~1920px: 8px ≈ 0.42%, для висоти ~1080px: 8px ≈ 0.74%
  // Використовуємо середнє значення для приблизного зміщення
  const offsetDistance = 0.5 // приблизно 8-10px в відсотках для середнього екрану
  const offsetX = Math.cos(angleRad) * offsetDistance
  const offsetY = Math.sin(angleRad) * offsetDistance
  const offsetStartX = startX + offsetX
  const offsetStartY = startY + offsetY
  
  // Створюємо keyframes динамічно
  if (typeof document !== 'undefined') {
    const styleSheet = document.styleSheets[0] || document.head.appendChild(document.createElement('style')).sheet
    
    const keyframes = `
      @keyframes ${animationName} {
        0% {
          left: ${offsetStartX}%;
          top: ${offsetStartY}%;
          transform: rotate(${angle - 90 + 180}deg) scale(0.2) translateZ(0);
          opacity: 0;
          filter: brightness(0.3) blur(8px);
        }
        1% {
          left: ${offsetStartX}%;
          top: ${offsetStartY}%;
          transform: rotate(${angle - 90 + 180}deg) scale(0.2) translateZ(0);
          opacity: 0;
          filter: brightness(0.3) blur(8px);
        }
        2% {
          left: ${offsetStartX}%;
          top: ${offsetStartY}%;
          transform: rotate(${angle - 90 + 180}deg) scale(0.25) translateZ(0);
          opacity: 0.05;
          filter: brightness(0.35) blur(7.5px);
        }
        4% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.01 + ${offsetX * 0.5}%);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.01 + ${offsetY * 0.5}%);
          transform: rotate(${angle - 90 + 180}deg) scale(0.3) translateZ(0);
          opacity: 0.1;
          filter: brightness(0.4) blur(7px);
        }
        6% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.02);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.02);
          transform: rotate(${angle - 90 + 180}deg) scale(0.35) translateZ(0);
          opacity: 0.2;
          filter: brightness(0.5) blur(6.5px);
        }
        8% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.03);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.03);
          transform: rotate(${angle - 90 + 180}deg) scale(0.4) translateZ(0);
          opacity: 0.3;
          filter: brightness(0.6) blur(6px);
        }
        12% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.05);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.05);
          transform: rotate(${angle - 90 + 180}deg) scale(0.5) translateZ(0);
          opacity: 0.4;
          filter: brightness(0.65) blur(5.5px);
        }
        16% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.08);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.08);
          transform: rotate(${angle - 90 + 180}deg) scale(0.6) translateZ(0);
          opacity: 0.5;
          filter: brightness(0.7) blur(5px);
        }
        20% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.12);
          top: calc(${startY}% + (${endY}% - ${startY}}) * 0.12);
          transform: rotate(${angle - 90 + 180}deg) scale(0.7) translateZ(0);
          opacity: 0.6;
          filter: brightness(0.75) blur(4.5px);
        }
        25% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.16);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.16);
          transform: rotate(${angle - 90 + 180}deg) scale(0.75) translateZ(0);
          opacity: 0.7;
          filter: brightness(0.8) blur(4px);
        }
        30% {
          left: calc(${startX}% + (${endX}% - ${startX}}) * 0.2);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.2);
          transform: rotate(${angle - 90 + 180}deg) scale(0.8) translateZ(0);
          opacity: 0.8;
          filter: brightness(0.85) blur(3px);
        }
        35% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.25);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.25);
          transform: rotate(${angle - 90 + 180}deg) scale(0.85) translateZ(0);
          opacity: 0.85;
          filter: brightness(0.9) blur(2px);
        }
        40% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.3);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.3);
          transform: rotate(${angle - 90 + 180}deg) scale(0.9) translateZ(0);
          opacity: 0.9;
          filter: brightness(0.95) blur(1px);
        }
        45% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.35);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.35);
          transform: rotate(${angle - 90 + 180}deg) scale(0.95) translateZ(0);
          opacity: 0.95;
          filter: brightness(0.98) blur(0.5px);
        }
        50% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.4);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.4);
          transform: rotate(${angle - 90 + 180}deg) scale(1) translateZ(0);
          opacity: 1;
          filter: brightness(1) blur(0px);
        }
        70% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.7);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.7);
          transform: rotate(${angle - 90 + 180}deg) scale(1) translateZ(0);
          opacity: 1;
          filter: brightness(1) blur(0px);
        }
        75% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.75);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.75);
          transform: rotate(${angle - 90 + 180}deg) scale(0.9) translateZ(0);
          opacity: 0.8;
          filter: brightness(0.9) blur(3px);
        }
        80% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.8);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.8);
          transform: rotate(${angle - 90 + 180}deg) scale(0.7) translateZ(0);
          opacity: 0.7;
          filter: brightness(0.8) blur(4px);
        }
        85% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.85);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.85);
          transform: rotate(${angle - 90 + 180}deg) scale(0.5) translateZ(0);
          opacity: 0.5;
          filter: brightness(0.7) blur(5px);
        }
        90% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.9);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.9);
          transform: rotate(${angle - 90 + 180}deg) scale(0.4) translateZ(0);
          opacity: 0.3;
          filter: brightness(0.6) blur(6px);
        }
        95% {
          left: calc(${startX}% + (${endX}% - ${startX}%) * 0.95);
          top: calc(${startY}% + (${endY}% - ${startY}%) * 0.95);
          transform: rotate(${angle - 90 + 180}deg) scale(0.2) translateZ(0);
          opacity: 0;
          filter: brightness(0.3) blur(8px);
        }
        100% {
          left: ${endX}%;
          top: ${endY}%;
          transform: rotate(${angle - 90 + 180}deg) scale(0.2) translateZ(0);
          opacity: 0;
          filter: brightness(0.3) blur(8px);
        }
      }
    `
    
    // Видаляємо стару анімацію, якщо вона існує
    try {
      const existingRule = Array.from(styleSheet.cssRules || []).find(
        rule => rule.type === CSSRule.KEYFRAMES_RULE && rule.name === animationName
      )
      if (existingRule) {
        styleSheet.deleteRule(Array.from(styleSheet.cssRules || []).indexOf(existingRule))
      }
    } catch (e) {
      // Ігноруємо помилки
    }
    
    // Додаємо нову анімацію
    try {
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length)
    } catch (e) {
      // Якщо не вдалося, використовуємо альтернативний метод
      const style = document.createElement('style')
      style.textContent = keyframes
      document.head.appendChild(style)
    }
  }
  
  return {
    id: id,
    startX: offsetStartX, // Використовуємо зміщену позицію для inline стилю
    startY: offsetStartY, // Використовуємо зміщену позицію для inline стилю
    endX: endX,
    endY: endY,
    angle: angle,
    duration: duration,
    delay: delay,
    animationName: animationName,
  }
}

// Обробник завершення анімації комети - генеруємо нову через 7 секунд
function onCometAnimationEnd(index) {
  if (index >= 0 && index < comets.value.length) {
    // Генеруємо нову комету з випадковими параметрами через 7 секунд
    setTimeout(() => {
      // Генеруємо нову комету з унікальним ID для keyframes
      const timestamp = Date.now()
      const newComet = generateComet(`${index}-${timestamp}`)
      // Оновлюємо масив комет - Vue автоматично перестворює елемент через унікальний key
      comets.value[index] = newComet
    }, 7000)
  }
}

// Функція для генерації астероїда (зменшена кількість)
function generateAsteroid(id) {
  const positions = [
    { startX: 10, endX: 90 },
    { startX: 30, endX: 70 },
    { startX: 50, endX: 20 },
    { startX: 80, endX: 40 },
  ]
  const pos = positions[id % positions.length]
  return {
    id: id,
    startX: pos.startX,
    startY: -5,
    endX: pos.endX,
    endY: 105,
    size: 4,
    rotation: id * 90,
    duration: 20,
    delay: id * 5,
  }
}

// Функція для генерації далекої планети (зменшена кількість)
function generateDistantPlanet(id) {
  const positions = [
    { x: 15, y: 25, size: 35 },
  ]
  const pos = positions[id % positions.length]
  return {
    id: id,
    x: pos.x,
    y: pos.y,
    size: pos.size,
    duration: 80,
    delay: 0,
  }
}

// Генеруємо зменшену кількість об'єктів при монтуванні
onMounted(async () => {
  // Туманності (2 замість 6)
  nebulae.value = Array.from({ length: 2 }, (_, i) => generateNebula(i))
  
  // Комети (1 комета, вона буде регенеруватися)
  comets.value = Array.from({ length: 1 }, (_, i) => generateComet(i))
  
  // Астероїди (4 замість 12)
  asteroids.value = Array.from({ length: 4 }, (_, i) => generateAsteroid(i))
  
  // Далекі планети (1 замість 3)
  distantPlanets.value = Array.from({ length: 1 }, (_, i) => generateDistantPlanet(i))
  
  // Чекаємо поки DOM оновиться і всі елементи будуть відрендерені
  await nextTick()
  
  // Використовуємо подвійний requestAnimationFrame для гарантії завершення рендерингу
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Даємо час на те, щоб всі елементи відрендерились і CSS застосувався
      setTimeout(() => {
        emit('stars-ready')
      }, 1000) // 1 секунда запасу
    })
  })
})
</script>

<style scoped>
.starry-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 30%, #16213e 60%, #0f3460 100%);
  background-attachment: fixed;
}

/* Статичні зірки через CSS градієнти (дуже швидко, без DOM елементів) */
.stars-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  opacity: 0.8;
  will-change: opacity;
  pointer-events: none;
}

/* Анімовані зірки (тільки невелика кількість для ефекту) */
.animated-star {
  position: absolute;
  background: white;
  border-radius: 50%;
  box-shadow: 
    0 0 3px rgba(255, 255, 255, 1),
    0 0 6px rgba(255, 255, 255, 0.8),
    0 0 9px rgba(150, 180, 255, 0.6),
    0 0 12px rgba(100, 150, 255, 0.4);
  animation: twinkleStar infinite ease-in-out;
  opacity: 0.9;
  transform-origin: center;
  will-change: transform, opacity;
}

/* Різні відтінки для анімованих зірок */
.animated-star:nth-child(3n) {
  box-shadow: 
    0 0 2px rgba(255, 220, 150, 0.9),
    0 0 4px rgba(255, 200, 100, 0.7),
    0 0 6px rgba(255, 180, 80, 0.5);
  background: rgba(255, 240, 200, 0.9);
}

.animated-star:nth-child(5n) {
  box-shadow: 
    0 0 2px rgba(150, 200, 255, 0.9),
    0 0 4px rgba(100, 180, 255, 0.7),
    0 0 6px rgba(80, 160, 255, 0.5);
  background: rgba(180, 220, 255, 0.9);
}


@keyframes twinkleStar {
  0%, 100% {
    opacity: 0.6;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* Туманності - оптимізовані */
.nebula {
  position: absolute;
  border-radius: 50%;
  opacity: 0.2;
  /* Використовуємо більш простий blur або зменшуємо його */
  filter: blur(40px);
  animation: nebulaPulse 20s ease-in-out infinite;
  z-index: 0;
  will-change: opacity;
  /* Використовуємо contain для ізоляції */
  contain: layout style paint;
}

.nebula:nth-child(odd) {
  background: radial-gradient(
    ellipse at center,
    rgba(150, 100, 255, 0.4) 0%,
    rgba(100, 150, 255, 0.3) 30%,
    rgba(50, 100, 200, 0.2) 60%,
    transparent 100%
  );
}

.nebula:nth-child(even) {
  background: radial-gradient(
    ellipse at center,
    rgba(255, 150, 100, 0.3) 0%,
    rgba(255, 100, 150, 0.2) 40%,
    rgba(200, 80, 120, 0.15) 70%,
    transparent 100%
  );
}

@keyframes nebulaPulse {
  0%, 100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.25;
  }
}

/* Комети - оптимізовані */
.comet {
  position: absolute;
  z-index: 1000;
  transform-origin: 0 0;
  width: 200px;
  height: 100px;
  will-change: left, top, transform, opacity;
  contain: none; /* Вимикаємо contain, щоб не обрізати комету */
  pointer-events: none;
  backface-visibility: hidden; /* Оптимізація рендерингу */
  overflow: visible; /* Дозволяємо вихід за межі */
  /* Переконаємося, що анімація запускається */
  animation-fill-mode: forwards;
  opacity: 0; /* Початковий стан - невидима */
}

.comet-head {
  width: 10px;
  height: 10px;
  background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 240, 200, 1) 25%, rgba(255, 200, 150, 1) 50%, rgba(255, 150, 100, 1) 75%, rgba(255, 100, 50, 1) 100%);
  border-radius: 50%;
  position: absolute;
  top: 0.5px;
  left: 0;
  z-index: 2;
  transform: translateZ(0); /* Апаратне прискорення */
}

.comet-tail {
  position: absolute;
  top: 0.5px;
  left: 10px;
  width: 160px;
  height: 40px;
  transform-origin: 0 50%;
  /* Хвіст має бути за кометою, тобто на 180 градусів від напрямку руху */
  /* Комета обертається на angle, тому хвіст має бути обернутий на 180 градусів відносно комети */
  transform: rotate(180deg) translateZ(0);
  z-index: 1;
  pointer-events: none;
}

.comet-flame {
  position: absolute;
  bottom: 0;
  left: 0;
  transform-origin: left bottom;
  border-radius: 50% 50% 40% 40% / 70% 70% 30% 30%;
  pointer-events: none;
}

/* Основне полум'я */
.comet-flame-main {
  width: 10px;
  height: 40px;
  background: radial-gradient(
    ellipse at center bottom,
    #ff9500 0%,
    #ff6b00 25%,
    #ff4500 45%,
    #ff0000 65%,
    transparent 80%
  );
  animation: cometFlameMain 0.25s ease-out infinite alternate;
  box-shadow: 
    0 0 10px rgba(255, 149, 0, 1),
    0 0 15px rgba(255, 107, 0, 0.8),
    0 0 20px rgba(255, 69, 0, 0.6),
    0 0 25px rgba(255, 0, 0, 0.4);
  filter: blur(0.5px);
}

/* Кінчик полум'я, що стрибає */
.comet-flame-tip {
  width: 7px;
  height: 42px;
  background: radial-gradient(
    ellipse at center bottom,
    #ffff00 0%,
    #ffaa00 25%,
    #ff8800 45%,
    #ff4500 65%,
    transparent 85%
  );
  animation: cometFlameTip 0.2s ease-in-out infinite alternate;
  animation-delay: 0.05s;
  box-shadow: 
    0 0 8px rgba(255, 255, 0, 1),
    0 0 12px rgba(255, 170, 0, 0.9),
    0 0 18px rgba(255, 136, 0, 0.7),
    0 0 22px rgba(255, 69, 0, 0.5);
  filter: blur(0.3px);
}

/* Іскри для комети */
.comet-spark {
  position: absolute;
  bottom: 5px;
  left: 0;
  width: 2px;
  height: 2px;
  background: #ffff00;
  border-radius: 50%;
  pointer-events: none;
  box-shadow: 0 0 4px rgba(255, 255, 0, 1);
  opacity: 1;
}

.comet-spark-1 {
  animation: cometSparkJump1 0.4s ease-out infinite;
}

.comet-spark-2 {
  animation: cometSparkJump2 0.35s ease-out infinite;
  animation-delay: 0.15s;
  background: #ff4500;
  box-shadow: 0 0 4px rgba(255, 69, 0, 1);
}

.comet-spark-3 {
  animation: cometSparkJump3 0.45s ease-out infinite;
  animation-delay: 0.25s;
  background: #ff6b00;
  box-shadow: 0 0 4px rgba(255, 107, 0, 1);
}

@keyframes cometFlameMain {
  0% {
    transform: scaleY(1) scaleX(1);
    opacity: 1;
  }
  100% {
    transform: scaleY(1.8) scaleX(0.75);
    opacity: 0.95;
  }
}

@keyframes cometFlameTip {
  0% {
    transform: scaleY(1) scaleX(1) translateY(0);
    opacity: 1;
  }
  100% {
    transform: scaleY(2) scaleX(0.7) translateY(-2px);
    opacity: 0.9;
  }
}

@keyframes cometSparkJump1 {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateX(-8px) translateY(-12px) scale(1.5);
    opacity: 0.8;
  }
  100% {
    transform: translateX(-5px) translateY(-20px) scale(0.3);
    opacity: 0;
  }
}

@keyframes cometSparkJump2 {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateX(8px) translateY(-10px) scale(1.3);
    opacity: 0.9;
  }
  100% {
    transform: translateX(6px) translateY(-18px) scale(0.2);
    opacity: 0;
  }
}

@keyframes cometSparkJump3 {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  33% {
    transform: translateX(-4px) translateY(-8px) scale(1.2);
    opacity: 0.85;
  }
  66% {
    transform: translateX(4px) translateY(-15px) scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: translateX(3px) translateY(-22px) scale(0.1);
    opacity: 0;
  }
}

/* Зірочки для комет */
.comet-star {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #ffffff;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 10;
  box-shadow: 
    0 0 2px rgba(255, 255, 255, 0.6),
    0 0 4px rgba(255, 255, 255, 0.5),
    0 0 6px rgba(255, 255, 255, 0.4);
  opacity: 0;
  filter: brightness(0.7);
  animation: cometStarSequence 2.5s ease-in-out var(--star-delay, 0s) forwards;
}

@keyframes cometStarSequence {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
  2% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  10% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.3);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  30% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.3);
  }
  40% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.3);
  }
  60% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  70% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  85% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(0.8);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
}

/* Астероїди - оптимізовані */
.asteroid {
  position: absolute;
  background: rgba(120, 120, 120, 0.5);
  border-radius: 30% 70% 40% 60% / 60% 40% 70% 30%;
  /* Спрощений box-shadow */
  box-shadow: 0 0 2px rgba(200, 200, 200, 0.2);
  animation: asteroidMove infinite linear;
  z-index: 1;
  will-change: transform;
  contain: layout style paint;
}

@keyframes asteroidMove {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  2% {
    opacity: 0.8;
  }
  98% {
    opacity: 0.8;
  }
  100% {
    transform: translate(var(--asteroid-translate-x, 100%), var(--asteroid-translate-y, 110%)) rotate(var(--asteroid-rotation, 360deg));
    opacity: 0;
  }
}

/* Далекі планети - оптимізовані */
.distant-planet {
  position: absolute;
  border-radius: 50%;
  opacity: 0.25;
  filter: blur(2px);
  animation: planetGlow 15s ease-in-out infinite;
  z-index: 0;
  will-change: opacity;
  contain: layout style paint;
}

.distant-planet:nth-child(1) {
  background: radial-gradient(circle, rgba(100, 150, 200, 0.3), transparent);
  box-shadow: 0 0 15px rgba(100, 150, 200, 0.2);
}

@keyframes planetGlow {
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.3;
  }
}

/* Адаптивність для менших екранів */
@media (max-width: 768px) {
  .stars-layer {
    opacity: 0.7;
  }
  
  .animated-star {
    box-shadow: 
      0 0 1px rgba(255, 255, 255, 0.9),
      0 0 3px rgba(255, 255, 255, 0.7),
      0 0 5px rgba(150, 180, 255, 0.5);
  }
  
  
  .nebula {
    filter: blur(30px);
    opacity: 0.1;
  }
  
  .comet-head {
    width: 6px;
    height: 6px;
  }
  
  .comet-tail {
    width: 80px;
    height: 20px;
  }
  
  .asteroid {
    box-shadow: 
      0 0 2px rgba(200, 200, 200, 0.2),
      inset -1px -1px 2px rgba(0, 0, 0, 0.2);
  }
  
  .distant-planet {
    opacity: 0.2;
    filter: blur(1.5px);
  }
}

/* Оптимізація продуктивності */
@media (prefers-reduced-motion: reduce) {
  .animated-star,
  .nebula,
  .comet,
  .asteroid,
  .distant-planet {
    animation: none;
  }
  
}
</style>

