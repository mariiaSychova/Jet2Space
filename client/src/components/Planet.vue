<template>
  <div 
    class="planet-container" 
    :data-planet-id="planet.id" 
    :class="{ 'card-open': props.isCardOpen }"
    :style="containerStyleWithBounce"
    ref="containerRef"
  >
    <!-- Гало навколо планети (рухається разом з планетою) -->
    <div class="planet-halo"></div>
    <div 
      class="planet-wrapper" 
      :style="wrapperStyle" 
      @click="goToPlanetDetail($event)" 
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave" 
      :title="`Клікніть, щоб дізнатися більше про ${planet.name}`"
      :class="{ 'planet-bouncing': true, 'is-visible': isVisible, 'card-open': props.isCardOpen }"
    >
      <!-- Статичне зображення за замовчуванням -->
      <div 
        v-if="!shouldLoadVideo" 
        class="planet-static"
      ></div>
      <!-- Відео завантажується тільки при hover -->
      <video 
        v-if="shouldLoadVideo"
        ref="videoPlayer" 
        :style="videoStyle" 
        :src="planet.animationPath" 
        class="planet-video" 
        :autoplay="false"
        :loop="true" 
        preload="metadata"
        muted 
        playsinline
        @loadeddata="onVideoLoaded"
        @canplay="onVideoCanPlay"
        @loadedmetadata="onVideoMetadataLoaded"
      ></video>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { playHover, playClick } from '../utils/sounds'

const props = defineProps({
  planet: {
    type: Object,
    required: true,
  },
  isCardOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['planet-click'])

const videoPlayer = ref(null)
const containerRef = ref(null)
const isVisible = ref(false)
const shouldLoadVideo = ref(false)
const isHovered = ref(false)
const intersectionObserver = ref(null)


// Мемоізуємо стилі для кращої продуктивності
const wrapperStyle = computed(() => {
  const size = props.planet.size || 200;
  const visualScale = props.planet.visualScale || 1;
  const bounceDuration = props.planet.bounceDuration || 4
  // Для Сатурна збільшуємо розмір wrapper, щоб вмістити кільця (менший множник для компактності)
  const saturnMultiplier = props.planet.id === 'saturn' ? 1.15 : 1;
  const containerSize = size * Math.max(1, visualScale) * saturnMultiplier;
  return {
    width: `${containerSize}px`,
    height: `${containerSize}px`,
    '--bounce-duration': `${bounceDuration}s`,
    '--planet-size': `${size}px`,
    '--visual-scale': `${visualScale}`,
  }
})

const containerStyleWithBounce = computed(() => {
  const margin = props.planet.horizontalMargin || 0
  const bounceDuration = props.planet.bounceDuration || 4
  return {
    margin: `0 ${margin}px`,
    '--bounce-duration': `${bounceDuration}s`,
  }
})

const videoStyle = computed(() => {
  const size = props.planet.size || 200
  const scale = props.planet.visualScale || 1
  // Для Сатурна збільшуємо розмір відео, щоб вмістити кільця, але зберігаємо пропорції
  const saturnMultiplier = props.planet.id === 'saturn' ? 1.15 : 1
  const videoSize = size * scale * saturnMultiplier
  return {
    width: `${videoSize}px`,
    height: `${videoSize}px`,
  }
})

// Обмежуємо playbackRate до оптимального діапазону для плавного відтворення
// Використовуємо мінімум 1.0 і максимум 2.0 для уникнення пролагів та рваності
// Масштабуємо швидкості з діапазону [0.004, 2.44] до [1.0, 2.0] зі збереженням пропорцій
function clampPlaybackRate(rate) {
  // Діапазон реальних швидкостей: від 0.004 (Венера) до 2.44 (Юпітер)
  const MIN_REAL_RATE = 0.004
  const MAX_REAL_RATE = 2.44
  
  // Діапазон playbackRate для плавного відтворення без пролагів та рваності
  const MIN_PLAYBACK_RATE = 1.0  // Мінімум 1.0 для плавного відтворення
  const MAX_PLAYBACK_RATE = 2.0  // Максимум для стабільності
  
  // Нормалізуємо швидкість до діапазону [0, 1]
  const normalized = (rate - MIN_REAL_RATE) / (MAX_REAL_RATE - MIN_REAL_RATE)
  
  // Масштабуємо до цільового діапазону [1.0, 2.0]
  const scaledRate = MIN_PLAYBACK_RATE + (normalized * (MAX_PLAYBACK_RATE - MIN_PLAYBACK_RATE))
  
  // Обмежуємо до фінального діапазону
  return Math.max(MIN_PLAYBACK_RATE, Math.min(MAX_PLAYBACK_RATE, scaledRate))
}

// Встановлюємо швидкість відтворення відео
function setupVideoPlaybackRate() {
  if (!videoPlayer.value || !isVisible.value || props.isCardOpen) return
  
  try {
    const rotationSpeed = props.planet.rotationSpeed || 1
    const clampedRate = clampPlaybackRate(rotationSpeed)
    videoPlayer.value.playbackRate = clampedRate
    
    if (isVisible.value && !isHovered.value && !props.isCardOpen) {
      videoPlayer.value.play().catch(() => {})
    }
  } catch (error) {
    // Ігноруємо помилки
  }
}

function onVideoLoaded() {
  // Не відтворюємо відео, якщо картка відкрита
  if (!props.isCardOpen) {
    setupVideoPlaybackRate()
  }
}

function onVideoCanPlay() {
  // Не відтворюємо відео, якщо картка відкрита
  if (!props.isCardOpen && isVisible.value && !isHovered.value) {
    setupVideoPlaybackRate()
  }
}

function onVideoMetadataLoaded() {
  // Коли метадані відео завантажені, встановлюємо playbackRate одразу
  // Це допомагає уникнути затримок при встановленні швидкості
  if (videoPlayer.value && !props.isCardOpen) {
    try {
      const rotationSpeed = props.planet.rotationSpeed || 1
      const clampedRate = clampPlaybackRate(rotationSpeed)
      videoPlayer.value.playbackRate = clampedRate
    } catch (error) {
      // Ігноруємо помилки
    }
  }
}

function handleMouseEnter() {
  isHovered.value = true
  // Не відтворюємо відео при hover, якщо картка відкрита
  if (videoPlayer.value && shouldLoadVideo.value && !props.isCardOpen) {
    try {
      const rotationSpeed = props.planet.rotationSpeed || 1
      const hoverRate = clampPlaybackRate(rotationSpeed * 1.5)
      videoPlayer.value.playbackRate = hoverRate
      videoPlayer.value.play().catch(error => console.error("Video play failed:", error))
      playHover()
    } catch (error) {
      // Ігноруємо помилки
    }
  }
}

function handleMouseLeave() {
  isHovered.value = false
  // Не відтворюємо відео, якщо картка відкрита
  if (videoPlayer.value && shouldLoadVideo.value && !props.isCardOpen) {
    try {
      const rotationSpeed = props.planet.rotationSpeed || 1
      const clampedRate = clampPlaybackRate(rotationSpeed)
      videoPlayer.value.playbackRate = clampedRate
    } catch (error) {
      // Ігноруємо помилки
    }
  }
}

function goToPlanetDetail(event) {
  // Якщо затиснута Ctrl / Cmd / Shift – використовуємо клік тільки як "замір координат"
  if (event && (event.ctrlKey || event.metaKey || event.shiftKey)) {
    // Не відкриваємо картку планети
    event.stopPropagation()
    return
  }
  playClick()
  emit('planet-click', props.planet.id)
}

// Використовуємо Intersection Observer для lazy loading
onMounted(() => {
  if (!containerRef.value) return
  
  // Завантажуємо відео коли планета входить у viewport з запасом
  intersectionObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !props.isCardOpen) {
          isVisible.value = true
          // Завантажуємо відео трохи пізніше для кращої продуктивності
          // Але не завантажуємо, якщо картка вже відкрита
          setTimeout(() => {
            if (!props.isCardOpen) {
              shouldLoadVideo.value = true
            }
          }, 100)
          // Відключаємо observer після завантаження
          if (intersectionObserver.value && containerRef.value) {
            intersectionObserver.value.unobserve(containerRef.value)
          }
        }
      })
    },
    {
      rootMargin: '50px', // Завантажуємо за 50px до появи у viewport
      threshold: 0.01
    }
  )
  
  intersectionObserver.value.observe(containerRef.value)
})

onUnmounted(() => {
  if (intersectionObserver.value && containerRef.value) {
    intersectionObserver.value.unobserve(containerRef.value)
    intersectionObserver.value.disconnect()
  }
  
  // Зупиняємо відео при демонтажі
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.src = ''
    videoPlayer.value.load()
  }
})

// Оновлюємо відео коли воно завантажиться
watch([isVisible, shouldLoadVideo], () => {
  if (isVisible.value && shouldLoadVideo.value) {
    nextTick(() => {
      setupVideoPlaybackRate()
    })
  }
})

// Призупиняємо відео коли відкрита картка планети
watch(() => props.isCardOpen, (isOpen) => {
  if (videoPlayer.value && shouldLoadVideo.value) {
    if (isOpen) {
      // Призупиняємо відео коли картка відкрита
      videoPlayer.value.pause()
    } else {
      // Відновлюємо відтворення одразу без жодних затримок
      if (isVisible.value && !isHovered.value) {
        try {
          // Встановлюємо playbackRate одразу
          const rotationSpeed = props.planet.rotationSpeed || 1
          const clampedRate = clampPlaybackRate(rotationSpeed)
          videoPlayer.value.playbackRate = clampedRate
          // Відновлюємо відтворення одразу, без жодних асинхронних обгорток
          videoPlayer.value.play().catch(() => {})
        } catch (error) {
          // Ігноруємо помилки
        }
      }
    }
  }
}, { immediate: false })
</script>

<style scoped>
.planet-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 10; /* Планети повинні бути поверх сузір'їв (z-index: 1) */
}

/* Для Сатурна дозволяємо вихід за межі контейнера для кілець */
.planet-container[data-planet-id="saturn"] {
  overflow: visible;
}

.planet-wrapper {
  position: relative;
  z-index: 2;
  border-radius: 50%;
  overflow: hidden;
  display: block;
  cursor: pointer;
  box-sizing: border-box;
  aspect-ratio: 1 / 1;
  /* Оптимізація продуктивності */
  will-change: transform;
  contain: layout style paint;
  /* Спрощена анімація */
  animation: planetBounce var(--bounce-duration, 4s) ease-in-out infinite;
  /* Спрощений box-shadow */
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* Для Сатурна дозволяємо видимість кілець, які виходять за межі */
.planet-container[data-planet-id="saturn"] .planet-wrapper {
  /* Дозволяємо вихід за межі для кілець */
  overflow: visible;
  /* Зменшуємо contain для дозволу виходу за межі */
  contain: style;
  /* Зберігаємо круглу форму wrapper */
  border-radius: 50%;
}

/* Призупиняємо анімацію коли картка відкрита */
.planet-wrapper.card-open {
  animation-play-state: paused;
}

.planet-container:has(.card-open) .planet-halo {
  animation-play-state: paused;
}

.planet-wrapper:hover {
  /* Спрощений hover effect */
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
  animation-play-state: paused;
}


.planet-container:hover .planet-halo {
  opacity: 0.8;
  /* При hover гало стає яскравішим, але bounce продовжує працювати через animation */
}

/* Гало навколо планети - оптимізоване світіння з внутрішньою та зовнішньою тінню */
.planet-halo {
  position: absolute;
  width: 120%;
  height: 120%;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
  /* Спрощена анімація */
  animation: 
    haloBounce var(--bounce-duration, 4s) ease-in-out infinite,
    haloPulse 5s ease-in-out infinite;
  opacity: 0.5;
  /* Оптимізація продуктивності */
  will-change: transform, opacity;
  contain: layout style paint;
  /* Прозорий фон з градієнтом для плавного переходу */
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(150, 180, 255, 0.05) 50%,
    rgba(100, 150, 255, 0.1) 60%,
    transparent 100%
  );
  /* Комбіновані внутрішні та зовнішні тіні для плавного переходу */
  box-shadow: 
    /* Зовнішні тіні */
    0 0 20px rgba(150, 180, 255, 0.15),
    0 0 40px rgba(100, 150, 255, 0.1),
    /* Внутрішні тіні для плавного переходу */
    inset 0 0 30px rgba(150, 180, 255, 0.1),
    inset 0 0 60px rgba(100, 150, 255, 0.05);
}

/* Призупиняємо анімацію гало коли картка відкрита */
.planet-container.card-open .planet-halo {
  animation-play-state: paused;
}

/* Різні кольори світіння для різних планет з внутрішніми та зовнішніми тінями */
.planet-container[data-planet-id="sun"] .planet-halo {
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(255, 200, 100, 0.08) 50%,
    rgba(255, 150, 50, 0.15) 60%,
    transparent 100%
  );
  box-shadow: 
    /* Зовнішні тіні */
    0 0 30px rgba(255, 200, 100, 0.3),
    0 0 60px rgba(255, 150, 50, 0.2),
    /* Внутрішні тіні */
    inset 0 0 40px rgba(255, 200, 100, 0.2),
    inset 0 0 80px rgba(255, 150, 50, 0.1);
  opacity: 0.6;
}

.planet-container[data-planet-id="mercury"] .planet-halo {
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(200, 180, 160, 0.06) 50%,
    rgba(200, 180, 160, 0.12) 60%,
    transparent 100%
  );
  box-shadow: 
    0 0 25px rgba(200, 180, 160, 0.2),
    inset 0 0 35px rgba(200, 180, 160, 0.15);
}

.planet-container[data-planet-id="venus"] .planet-halo {
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(255, 210, 170, 0.07) 50%,
    rgba(255, 210, 170, 0.14) 60%,
    transparent 100%
  );
  box-shadow: 
    0 0 25px rgba(255, 210, 170, 0.25),
    inset 0 0 35px rgba(255, 210, 170, 0.2);
}

.planet-container[data-planet-id="earth"] .planet-halo {
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(100, 150, 255, 0.07) 50%,
    rgba(100, 150, 255, 0.14) 60%,
    transparent 100%
  );
  box-shadow: 
    0 0 30px rgba(100, 150, 255, 0.25),
    inset 0 0 40px rgba(100, 150, 255, 0.2);
}

.planet-container[data-planet-id="mars"] .planet-halo {
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(230, 100, 80, 0.07) 50%,
    rgba(230, 100, 80, 0.14) 60%,
    transparent 100%
  );
  box-shadow: 
    0 0 25px rgba(230, 100, 80, 0.25),
    inset 0 0 35px rgba(230, 100, 80, 0.2);
}

.planet-container[data-planet-id="jupiter"] .planet-halo {
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(200, 160, 110, 0.07) 50%,
    rgba(200, 160, 110, 0.14) 60%,
    transparent 100%
  );
  box-shadow: 
    0 0 30px rgba(200, 160, 110, 0.25),
    inset 0 0 40px rgba(200, 160, 110, 0.2);
}

.planet-container[data-planet-id="saturn"] .planet-halo {
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(240, 210, 180, 0.07) 50%,
    rgba(240, 210, 180, 0.14) 60%,
    transparent 100%
  );
  box-shadow: 
    0 0 30px rgba(240, 210, 180, 0.25),
    inset 0 0 40px rgba(240, 210, 180, 0.2);
}

.planet-container[data-planet-id="uranus"] .planet-halo {
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(150, 200, 245, 0.07) 50%,
    rgba(150, 200, 245, 0.14) 60%,
    transparent 100%
  );
  box-shadow: 
    0 0 25px rgba(150, 200, 245, 0.25),
    inset 0 0 35px rgba(150, 200, 245, 0.2);
}

.planet-container[data-planet-id="neptune"] .planet-halo {
  background: radial-gradient(
    circle,
    transparent 40%,
    rgba(80, 130, 235, 0.07) 50%,
    rgba(80, 130, 235, 0.14) 60%,
    transparent 100%
  );
  box-shadow: 
    0 0 30px rgba(80, 130, 235, 0.25),
    inset 0 0 40px rgba(80, 130, 235, 0.2);
}

.planet-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(100, 150, 255, 0.2), transparent);
  pointer-events: none;
}

.planet-video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateZ(0) scale(1.15);
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  display: block;
  /* Оптимізація продуктивності для плавного відтворення */
  will-change: transform;
  /* Спрощена transition */
  transition: transform 0.3s ease;
  /* Примусова апаратна акселерація для покращення продуктивності відео */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* Оптимізація рендерингу відео */
  image-rendering: auto;
  /* Використання GPU для відео */
  contain: layout style paint;
}

/* Для Сатурна дозволяємо відео виходити за межі wrapper для кілець */
.planet-container[data-planet-id="saturn"] .planet-video {
  /* Використовуємо contain, щоб показати кільця повністю зі збереженням пропорцій */
  object-fit: contain;
  /* Видаляємо border-radius, щоб кільця не обрізалися */
  border-radius: 0;
}

.planet-wrapper:hover .planet-video {
  transform: translate(-50%, -50%) scale(1.215);
  transform-origin: center center;
}

/* Оптимізовані анімації з використанням transform */
@keyframes planetBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes haloBounce {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-6px);
  }
}

@keyframes haloPulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.6;
  }
}

/* Різні затримки для анімації підстрибування кожної планети */
.planet-container[data-planet-id="sun"] .planet-wrapper {
  animation-delay: 0s;
}
.planet-container[data-planet-id="sun"] .planet-halo {
  animation-delay: 0s, 0s; /* bounce, pulse */
}

.planet-container[data-planet-id="mercury"] .planet-wrapper {
  animation-delay: 0.3s;
}
.planet-container[data-planet-id="mercury"] .planet-halo {
  animation-delay: 0.3s, 0s; /* bounce, pulse */
}

.planet-container[data-planet-id="venus"] .planet-wrapper {
  animation-delay: 0.6s;
}
.planet-container[data-planet-id="venus"] .planet-halo {
  animation-delay: 0.6s, 0s; /* bounce, pulse */
}

.planet-container[data-planet-id="earth"] .planet-wrapper {
  animation-delay: 0.9s;
}
.planet-container[data-planet-id="earth"] .planet-halo {
  animation-delay: 0.9s, 0s; /* bounce, pulse */
}

.planet-container[data-planet-id="mars"] .planet-wrapper {
  animation-delay: 1.2s;
}
.planet-container[data-planet-id="mars"] .planet-halo {
  animation-delay: 1.2s, 0s; /* bounce, pulse */
}

.planet-container[data-planet-id="jupiter"] .planet-wrapper {
  animation-delay: 1.5s;
}
.planet-container[data-planet-id="jupiter"] .planet-halo {
  animation-delay: 1.5s, 0s; /* bounce, pulse */
}

.planet-container[data-planet-id="saturn"] .planet-wrapper {
  animation-delay: 1.8s;
}
.planet-container[data-planet-id="saturn"] .planet-halo {
  animation-delay: 1.8s, 0s; /* bounce, pulse */
}

.planet-container[data-planet-id="uranus"] .planet-wrapper {
  animation-delay: 2.1s;
}
.planet-container[data-planet-id="uranus"] .planet-halo {
  animation-delay: 2.1s, 0s; /* bounce, pulse */
}

.planet-container[data-planet-id="neptune"] .planet-wrapper {
  animation-delay: 2.4s;
}
.planet-container[data-planet-id="neptune"] .planet-halo {
  animation-delay: 2.4s, 0s; /* bounce, pulse */
}
</style>