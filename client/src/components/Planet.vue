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
      @click="goToPlanetDetail" 
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave" 
      :title="`Клікніть, щоб дізнатися більше про ${planet.name}`"
      :class="{ 'planet-bouncing': true, 'is-visible': isVisible, 'card-open': props.isCardOpen }"
    >
      <!-- Статичне зображення за замовчуванням -->
      <div 
        v-if="!shouldLoadVideo" 
        class="planet-static"
        :style="planetStaticStyle"
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
        preload="none"
        muted 
        playsinline
        @loadeddata="onVideoLoaded"
        @canplay="onVideoCanPlay"
      ></video>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

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
  const containerSize = size * Math.max(1, visualScale);
  return {
    width: `${containerSize}px`,
    height: `${containerSize}px`,
    '--bounce-duration': `${bounceDuration}s`,
    '--planet-size': `${size}px`,
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
  const videoSize = size * scale
  return {
    width: `${videoSize}px`,
    height: `${videoSize}px`,
  }
})

// Обмежуємо playbackRate до підтримуваного браузером діапазону
function clampPlaybackRate(rate) {
  return Math.max(0.25, Math.min(4.0, rate))
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

function handleMouseEnter() {
  isHovered.value = true
  // Не відтворюємо відео при hover, якщо картка відкрита
  if (videoPlayer.value && shouldLoadVideo.value && !props.isCardOpen) {
    try {
      const rotationSpeed = props.planet.rotationSpeed || 1
      const hoverRate = clampPlaybackRate(rotationSpeed * 1.5)
      videoPlayer.value.playbackRate = hoverRate
      videoPlayer.value.play().catch(() => {})
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

function goToPlanetDetail() {
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
      // Відновлюємо відтворення тільки якщо планета видима і не на hover
      if (isVisible.value && !isHovered.value) {
        setupVideoPlaybackRate()
      }
    }
  }
})
</script>

<style scoped>
.planet-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

/* Гало навколо планети - оптимізоване світіння */
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
  /* Спрощений box-shadow - менше шарів для кращої продуктивності */
  box-shadow: 
    0 0 30px rgba(150, 180, 255, 0.2),
    0 0 60px rgba(100, 150, 255, 0.1);
}

/* Призупиняємо анімацію гало коли картка відкрита */
.planet-container.card-open .planet-halo {
  animation-play-state: paused;
}

/* Різні кольори світіння для різних планет - спрощені */
.planet-container[data-planet-id="sun"] .planet-halo {
  box-shadow: 0 0 50px rgba(255, 200, 100, 0.4), 0 0 100px rgba(255, 150, 50, 0.2);
  opacity: 0.6;
}

.planet-container[data-planet-id="mercury"] .planet-halo {
  box-shadow: 0 0 40px rgba(200, 180, 160, 0.25);
}

.planet-container[data-planet-id="venus"] .planet-halo {
  box-shadow: 0 0 40px rgba(255, 210, 170, 0.3);
}

.planet-container[data-planet-id="earth"] .planet-halo {
  box-shadow: 0 0 50px rgba(100, 150, 255, 0.3);
}

.planet-container[data-planet-id="mars"] .planet-halo {
  box-shadow: 0 0 40px rgba(230, 100, 80, 0.3);
}

.planet-container[data-planet-id="jupiter"] .planet-halo {
  box-shadow: 0 0 50px rgba(200, 160, 110, 0.3);
}

.planet-container[data-planet-id="saturn"] .planet-halo {
  box-shadow: 0 0 50px rgba(240, 210, 180, 0.3);
}

.planet-container[data-planet-id="uranus"] .planet-halo {
  box-shadow: 0 0 40px rgba(150, 200, 245, 0.3);
}

.planet-container[data-planet-id="neptune"] .planet-halo {
  box-shadow: 0 0 50px rgba(80, 130, 235, 0.3);
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
  transform: translate(-50%, -50%);
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  display: block;
  /* Оптимізація продуктивності */
  will-change: transform;
  /* Спрощена transition */
  transition: transform 0.3s ease;
}

.planet-wrapper:hover .planet-video {
  transform: translate(-50%, -50%) scale(1.1);
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