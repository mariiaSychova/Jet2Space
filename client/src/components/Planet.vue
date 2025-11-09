<template>
  <div 
    class="planet-wrapper" 
    :style="wrapperStyle" 
    @click="goToPlanetDetail" 
    @mouseover="playVideo"
    @mouseleave="pauseVideo" 
    :title="`Клікніть, щоб дізнатися більше про ${planet.name}`"
    :class="{ 'planet-bouncing': true }"
    :data-planet-id="planet.id"
  >
    <!-- Гало навколо планети -->
    <div class="planet-halo"></div>
    <video 
      ref="videoPlayer" 
      :style="videoStyle" 
      :src="planet.animationPath" 
      class="planet-video" 
      :autoplay="true"
      :loop="true" 
      muted 
      playsinline
    ></video>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  planet: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['planet-click'])

const videoPlayer = ref(null)

const wrapperStyle = computed(() => {
  const size = props.planet.size || 200;
  const margin = props.planet.horizontalMargin || 0
  const bounceDuration = props.planet.bounceDuration || 4
  return {
    width: `${size}px`,
    height: `${size}px`,
    margin: `0 ${margin}px`,
    '--bounce-duration': `${bounceDuration}s`,
  }
})

const videoStyle = computed(() => {
  const size = props.planet.size || 200
  const scale = props.planet.visualScale || 1
  const videoSize = size * scale
  const rotationSpeed = props.planet.rotationSpeed || 1
  return {
    width: `${videoSize}px`,
    height: `${videoSize}px`,
    '--rotation-speed': rotationSpeed,
  }
})

// Встановлюємо швидкість відтворення відео на основі реальної швидкості обертання
function setupVideoPlaybackRate() {
  if (videoPlayer.value) {
    const rotationSpeed = props.planet.rotationSpeed || 1
    // Встановлюємо playbackRate для відображення реальної швидкості обертання
    videoPlayer.value.playbackRate = rotationSpeed
    
    // Автоматично відтворюємо відео з правильною швидкістю
    videoPlayer.value.play().catch(error => {
      console.error("Video play failed:", error)
    })
  }
}

function playVideo() {
  if (videoPlayer.value) {
    // Збільшуємо швидкість при наведенні для візуального ефекту
    const rotationSpeed = props.planet.rotationSpeed || 1
    videoPlayer.value.playbackRate = rotationSpeed * 1.5
    videoPlayer.value.play().catch(error => console.error("Video play failed:", error))
  }
}

function pauseVideo() {
  // Повертаємо нормальну швидкість обертання при відведенні миші
  if (videoPlayer.value) {
    const rotationSpeed = props.planet.rotationSpeed || 1
    videoPlayer.value.playbackRate = rotationSpeed
  }
}

function goToPlanetDetail() {
  emit('planet-click', props.planet.id)
}

// Налаштовуємо відео при монтуванні
onMounted(() => {
  setupVideoPlaybackRate()
  
  // Також налаштовуємо при зміні планети
  if (videoPlayer.value) {
    videoPlayer.value.addEventListener('loadedmetadata', setupVideoPlaybackRate)
  }
})

// Оновлюємо швидкість при зміні планети
watch(() => props.planet, () => {
  setupVideoPlaybackRate()
}, { immediate: true })
</script>

<style scoped>
.planet-wrapper {
  position: relative;
  z-index: 3;
  border-radius: 50%;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  transition: box-shadow 0.4s ease;
  animation: planetBounce var(--bounce-duration, 4s) ease-in-out infinite;
}

.planet-wrapper:hover {
  box-shadow: 0 0 60px 8px rgba(255, 255, 255, 0.4);
  animation-play-state: paused;
}

/* Гало навколо планети */
.planet-halo {
  position: absolute;
  width: 120%;
  height: 120%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(150, 200, 255, 0.08) 30%,
    rgba(100, 150, 255, 0.05) 50%,
    transparent 70%
  );
  pointer-events: none;
  z-index: -1;
  animation: haloPulse 3s ease-in-out infinite;
  filter: blur(8px);
}

/* Різні кольори гало для різних планет */
.planet-wrapper[data-planet-id="sun"] .planet-halo {
  background: radial-gradient(
    circle,
    rgba(255, 200, 100, 0.15) 0%,
    rgba(255, 150, 50, 0.12) 30%,
    rgba(255, 100, 0, 0.08) 50%,
    transparent 70%
  );
  filter: blur(12px);
}

.planet-wrapper[data-planet-id="mercury"] .planet-halo {
  background: radial-gradient(
    circle,
    rgba(200, 180, 160, 0.12) 0%,
    rgba(180, 160, 140, 0.08) 40%,
    transparent 70%
  );
}

.planet-wrapper[data-planet-id="venus"] .planet-halo {
  background: radial-gradient(
    circle,
    rgba(255, 220, 180, 0.12) 0%,
    rgba(255, 200, 150, 0.08) 40%,
    transparent 70%
  );
}

.planet-wrapper[data-planet-id="earth"] .planet-halo {
  background: radial-gradient(
    circle,
    rgba(100, 150, 255, 0.12) 0%,
    rgba(80, 120, 200, 0.08) 40%,
    transparent 70%
  );
}

.planet-wrapper[data-planet-id="mars"] .planet-halo {
  background: radial-gradient(
    circle,
    rgba(255, 100, 80, 0.12) 0%,
    rgba(200, 80, 60, 0.08) 40%,
    transparent 70%
  );
}

.planet-wrapper[data-planet-id="jupiter"] .planet-halo {
  background: radial-gradient(
    circle,
    rgba(200, 150, 100, 0.12) 0%,
    rgba(180, 130, 80, 0.08) 40%,
    transparent 70%
  );
}

.planet-wrapper[data-planet-id="saturn"] .planet-halo {
  background: radial-gradient(
    circle,
    rgba(255, 220, 180, 0.12) 0%,
    rgba(240, 200, 160, 0.08) 40%,
    transparent 70%
  );
}

.planet-wrapper[data-planet-id="uranus"] .planet-halo {
  background: radial-gradient(
    circle,
    rgba(150, 200, 255, 0.12) 0%,
    rgba(120, 180, 240, 0.08) 40%,
    transparent 70%
  );
}

.planet-wrapper[data-planet-id="neptune"] .planet-halo {
  background: radial-gradient(
    circle,
    rgba(100, 150, 255, 0.15) 0%,
    rgba(80, 130, 220, 0.1) 40%,
    transparent 70%
  );
}

.planet-video {
  position: absolute;
  width: 108%;
  height: 108%;
  border-radius: 50%;
  object-fit: cover;

  pointer-events: none;

  transition: transform 0.4s ease, filter 0.4s ease;

  transform: scale(1.08);
  filter: brightness(1);
}

.planet-wrapper:hover .planet-video {
  transform: scale(1.15);
  filter: brightness(1.2);
}

/* Анімація підстрибування */
@keyframes planetBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* Анімація пульсації гало */
@keyframes haloPulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

/* Різні затримки для анімації підстрибування кожної планети */
.planet-wrapper[data-planet-id="sun"] {
  animation-delay: 0s;
}

.planet-wrapper[data-planet-id="mercury"] {
  animation-delay: 0.3s;
}

.planet-wrapper[data-planet-id="venus"] {
  animation-delay: 0.6s;
}

.planet-wrapper[data-planet-id="earth"] {
  animation-delay: 0.9s;
}

.planet-wrapper[data-planet-id="mars"] {
  animation-delay: 1.2s;
}

.planet-wrapper[data-planet-id="jupiter"] {
  animation-delay: 1.5s;
}

.planet-wrapper[data-planet-id="saturn"] {
  animation-delay: 1.8s;
}

.planet-wrapper[data-planet-id="uranus"] {
  animation-delay: 2.1s;
}

.planet-wrapper[data-planet-id="neptune"] {
  animation-delay: 2.4s;
}
</style>