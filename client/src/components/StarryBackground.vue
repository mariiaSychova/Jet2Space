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
    
    <!-- Менше комет (2 замість 4) -->
    <div 
      v-for="comet in comets" 
      :key="'comet-' + comet.id"
      class="comet"
      :style="{
        left: comet.startX + '%',
        top: comet.startY + '%',
        animationDuration: comet.duration + 's',
        animationDelay: comet.delay + 's',
        '--comet-translate-x': (comet.endX - comet.startX) + '%',
        '--comet-translate-y': (comet.endY - comet.startY) + '%',
        '--comet-angle': comet.angle + 'deg'
      }"
    >
      <div class="comet-head"></div>
      <div class="comet-tail"></div>
    </div>
    
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
    
    <!-- Constellation lines -->
    <svg class="constellation-lines" xmlns="http://www.w3.org/2000/svg">
      <line 
        v-for="(line, index) in constellationLines" 
        :key="'line-' + index"
        :x1="line.x1 + '%'"
        :y1="line.y1 + '%'"
        :x2="line.x2 + '%'"
        :y2="line.y2 + '%'"
        class="constellation-line"
        :style="{ '--line-delay': index * 0.15 + 's' }"
      />
    </svg>
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

const constellationLines = ref([
  // Сузір'я 1 (Великий Віз)
  { x1: 10, y1: 15, x2: 20, y2: 20 },
  { x1: 20, y1: 20, x2: 30, y2: 15 },
  { x1: 30, y1: 15, x2: 40, y2: 25 },
  { x1: 20, y1: 20, x2: 25, y2: 30 },
  // Сузір'я 2 (Оріон)
  { x1: 55, y1: 10, x2: 65, y2: 15 },
  { x1: 65, y1: 15, x2: 70, y2: 25 },
  { x1: 60, y1: 20, x2: 67, y2: 30 },
  { x1: 65, y1: 15, x2: 68, y2: 8 },
  // Сузір'я 3 (Кассіопея)
  { x1: 15, y1: 55, x2: 25, y2: 60 },
  { x1: 25, y1: 60, x2: 35, y2: 55 },
  { x1: 35, y1: 55, x2: 30, y2: 65 },
  { x1: 25, y1: 60, x2: 20, y2: 70 },
  // Сузір'я 4 (Лебедь)
  { x1: 70, y1: 50, x2: 75, y2: 55 },
  { x1: 75, y1: 55, x2: 80, y2: 60 },
  { x1: 75, y1: 55, x2: 72, y2: 65 },
  { x1: 80, y1: 60, x2: 85, y2: 65 },
  // Сузір'я 5 (Ліра)
  { x1: 45, y1: 35, x2: 50, y2: 40 },
  { x1: 50, y1: 40, x2: 55, y2: 38 },
  { x1: 50, y1: 40, x2: 48, y2: 45 },
  { x1: 50, y1: 40, x2: 52, y2: 45 },
  // Сузір'я 6 (Північна Корона)
  { x1: 25, y1: 40, x2: 30, y2: 42 },
  { x1: 30, y1: 42, x2: 35, y2: 40 },
  { x1: 35, y1: 40, x2: 32, y2: 45 },
  { x1: 30, y1: 42, x2: 28, y2: 47 },
  // Сузір'я 7 (Пегас)
  { x1: 5, y1: 30, x2: 12, y2: 35 },
  { x1: 12, y1: 35, x2: 18, y2: 32 },
  { x1: 18, y1: 32, x2: 22, y2: 38 },
  { x1: 12, y1: 35, x2: 10, y2: 42 },
  // Сузір'я 8 (Скорпіон)
  { x1: 50, y1: 70, x2: 55, y2: 75 },
  { x1: 55, y1: 75, x2: 60, y2: 72 },
  { x1: 60, y1: 72, x2: 65, y2: 78 },
  { x1: 55, y1: 75, x2: 58, y2: 80 },
])

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

// Функція для генерації комети (зменшена кількість)
function generateComet(id) {
  const comets = [
    { startY: 20, angle: 30 },
    { startY: 80, angle: 45 },
  ]
  const comet = comets[id % comets.length]
  const startX = -5
  const distance = 120
  const endX = startX + Math.cos(comet.angle * Math.PI / 180) * distance
  const endY = comet.startY + Math.sin(comet.angle * Math.PI / 180) * distance
  
  return {
    id: id,
    startX: startX,
    startY: comet.startY,
    endX: endX,
    endY: endY,
    angle: comet.angle,
    duration: 25,
    delay: id * 15,
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
  
  // Комети (2 замість 4)
  comets.value = Array.from({ length: 2 }, (_, i) => generateComet(i))
  
  // Астероїди (4 замість 12)
  asteroids.value = Array.from({ length: 4 }, (_, i) => generateAsteroid(i))
  
  // Далекі планети (1 замість 3)
  distantPlanets.value = Array.from({ length: 1 }, (_, i) => generateDistantPlanet(i))
  
  // Чекаємо поки DOM оновиться і всі елементи будуть відрендерені
  await nextTick()
  
  // Використовуємо подвійний requestAnimationFrame для гарантії завершення рендерингу
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Дочекаємося початку анімації сузір'й (перші лінії починаються відразу)
      // Але даємо час на те, щоб всі елементи відрендерились і CSS застосувався
      // Обчислюємо час до появи останньої лінії сузір'й (не завершення, а початку)
      const maxLineDelay = (constellationLines.value.length - 1) * 0.15
      // Дочекаємося, поки остання лінія почне малюватися, плюс невеликий запас
      // Це забезпечить, що всі сузір'я вже почали анімуватися
      const waitTime = (maxLineDelay + 1) * 1000 // +1 секунда запасу
      
      setTimeout(() => {
        emit('stars-ready')
      }, Math.min(waitTime, 3000)) // Максимум 3 секунди
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

/* Констеляції */
.constellation-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.constellation-line {
  stroke: rgba(150, 180, 255, 0.6);
  stroke-width: 1.5;
  stroke-dasharray: 3, 3;
  fill: none;
  animation: drawConstellation 4s ease-in-out forwards;
  animation-delay: var(--line-delay, 0s);
  opacity: 0;
  filter: drop-shadow(0 0 3px rgba(150, 180, 255, 0.5));
}

@keyframes drawConstellation {
  0% {
    stroke-dashoffset: 20;
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0.4;
  }
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
  z-index: 1;
  animation: cometMove infinite linear;
  transform-origin: center;
  width: 0;
  height: 0;
  will-change: transform;
  contain: layout style paint;
}

.comet-head {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(150, 200, 255, 0.6),
    0 0 30px rgba(100, 150, 255, 0.4);
  position: absolute;
  top: -4px;
  left: -4px;
}

.comet-tail {
  width: 80px;
  height: 3px;
  background: linear-gradient(
    to left,
    rgba(150, 200, 255, 0.8) 0%,
    rgba(100, 150, 255, 0.5) 30%,
    rgba(50, 100, 200, 0.3) 60%,
    transparent 100%
  );
  position: absolute;
  top: -1.5px;
  left: -80px;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(150, 200, 255, 0.4);
  transform-origin: right center;
  transform: rotate(calc(180deg - var(--comet-angle, 45deg)));
}

@keyframes cometMove {
  0% {
    transform: translate(0, 0) rotate(calc(90deg - var(--comet-angle, 45deg)));
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--comet-translate-x, 120%), var(--comet-translate-y, 120%)) rotate(calc(90deg - var(--comet-angle, 45deg)));
    opacity: 0;
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
  
  .constellation-line {
    stroke-width: 0.8;
    opacity: 0.2;
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
    width: 60px;
    height: 2px;
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
  
  .constellation-line {
    animation: none;
    opacity: 0.25;
  }
}
</style>

