<template>
  <div class="planet-container" :data-planet-id="planet.id" :style="containerStyleWithBounce">
    <!-- Гало навколо планети (рухається разом з планетою) -->
    <div class="planet-halo"></div>
    <div 
      class="planet-wrapper" 
      :style="wrapperStyle" 
      @click="goToPlanetDetail" 
      @mouseover="playVideo"
      @mouseleave="pauseVideo" 
      :title="`Клікніть, щоб дізнатися більше про ${planet.name}`"
      :class="{ 'planet-bouncing': true }"
    >
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { playHover, playClick } from '../utils/sounds'

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
  const visualScale = props.planet.visualScale || 1;
  const bounceDuration = props.planet.bounceDuration || 4
  // Якщо є visualScale, збільшуємо контейнер, щоб відео не обрізалося
  // Але залишаємо базовий розмір для позиціонування
  const containerSize = size * Math.max(1, visualScale);
  // Використовуємо однакові розміри для width і height, щоб гарантувати круглу форму
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
  const rotationSpeed = props.planet.rotationSpeed || 1
  // Обчислюємо розмір відео безпосередньо
  const videoSize = size * scale
  return {
    width: `${videoSize}px`,
    height: `${videoSize}px`,
    '--rotation-speed': rotationSpeed,
  }
})

// Обмежуємо playbackRate до підтримуваного браузером діапазону (зазвичай 0.25-4.0)
function clampPlaybackRate(rate) {
  const minRate = 0.25  // Мінімальна підтримувана швидкість
  const maxRate = 4.0   // Максимальна підтримувана швидкість
  return Math.max(minRate, Math.min(maxRate, rate))
}

// Встановлюємо швидкість відтворення відео на основі реальної швидкості обертання
function setupVideoPlaybackRate() {
  if (videoPlayer.value) {
    try {
      const rotationSpeed = props.planet.rotationSpeed || 1
      // Встановлюємо playbackRate для відображення реальної швидкості обертання
      // Обмежуємо значення до підтримуваного діапазону
      const clampedRate = clampPlaybackRate(rotationSpeed)
      videoPlayer.value.playbackRate = clampedRate
      
      // Автоматично відтворюємо відео з правильною швидкістю
      videoPlayer.value.play().catch(error => {
        console.error("Video play failed:", error)
      })
    } catch (error) {
      // Якщо не вдається встановити playbackRate, просто ігноруємо помилку
      console.warn("Could not set playback rate:", error)
    }
  }
}

function playVideo() {
  if (videoPlayer.value) {
    try {
      // Збільшуємо швидкість при наведенні для візуального ефекту
      const rotationSpeed = props.planet.rotationSpeed || 1
      const hoverRate = clampPlaybackRate(rotationSpeed * 1.5)
      videoPlayer.value.playbackRate = hoverRate
      videoPlayer.value.play().catch(error => console.error("Video play failed:", error))
      playHover()
    } catch (error) {
      console.warn("Could not set playback rate on hover:", error)
    }
  }
}

function pauseVideo() {
  // Повертаємо нормальну швидкість обертання при відведенні миші
  if (videoPlayer.value) {
    try {
      const rotationSpeed = props.planet.rotationSpeed || 1
      const clampedRate = clampPlaybackRate(rotationSpeed)
      videoPlayer.value.playbackRate = clampedRate
    } catch (error) {
      console.warn("Could not set playback rate on pause:", error)
    }
  }
}

function goToPlanetDetail() {
  playClick()
  console.log('goToPlanetDetail called for planet:', props.planet.id, props.planet.name)
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
  overflow: hidden; /* Залишаємо hidden, але wrapper тепер достатньо великий для відео */

  display: block;
  cursor: pointer;

  transition: box-shadow 0.4s ease;
  animation: planetBounce var(--bounce-duration, 4s) ease-in-out infinite;
  
  /* Гарантуємо круглу форму - використовуємо aspect-ratio */
  box-sizing: border-box;
  aspect-ratio: 1 / 1;
}

.planet-wrapper:hover {
  box-shadow: 0 0 60px 8px rgba(255, 255, 255, 0.4);
  animation-play-state: paused;
}

.planet-container:hover .planet-halo {
  opacity: 0.8;
  /* При hover гало стає яскравішим, але bounce продовжує працювати через animation */
}

/* Гало навколо планети - природне космічне світіння */
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
  /* Комбінована анімація: bounce (синхронізована з планетою) + pulse */
  animation: 
    haloBounce var(--bounce-duration, 4s) ease-in-out infinite,
    haloPulse 5s ease-in-out infinite;
  opacity: 0.5;
  /* Використовуємо box-shadow для природного світіння з об'ємними внутрішніми тінями */
  box-shadow: 
    0 0 20px rgba(255, 255, 255, 0.15),
    0 0 40px rgba(200, 220, 255, 0.1),
    0 0 60px rgba(150, 180, 255, 0.08),
    /* Внутрішні тіні для об'ємності */
    inset 0 0 20px rgba(255, 255, 255, 0.08),
    inset 0 0 40px rgba(200, 220, 255, 0.06),
    inset 0 0 60px rgba(150, 180, 255, 0.04),
    inset 0 0 80px rgba(100, 150, 255, 0.02);
}

/* Різні кольори світіння для різних планет через box-shadow */
.planet-container[data-planet-id="sun"] .planet-halo {
  box-shadow: 
    0 0 25px rgba(255, 220, 100, 0.3),
    0 0 50px rgba(255, 180, 60, 0.2),
    0 0 75px rgba(255, 140, 30, 0.15),
    0 0 100px rgba(255, 100, 0, 0.1),
    /* Внутрішні тіні для об'ємного сонячного світіння */
    inset 0 0 30px rgba(255, 240, 160, 0.25),
    inset 0 0 60px rgba(255, 220, 120, 0.18),
    inset 0 0 90px rgba(255, 200, 80, 0.12),
    inset 0 0 120px rgba(255, 180, 40, 0.08),
    inset 0 0 150px rgba(255, 160, 20, 0.04);
  opacity: 0.6;
}

.planet-container[data-planet-id="mercury"] .planet-halo {
  box-shadow: 
    0 0 20px rgba(220, 200, 180, 0.2),
    0 0 40px rgba(200, 180, 160, 0.15),
    0 0 60px rgba(180, 160, 140, 0.1),
    /* Внутрішні тіні для об'ємного сірого світіння */
    inset 0 0 25px rgba(200, 180, 160, 0.12),
    inset 0 0 50px rgba(180, 160, 140, 0.08),
    inset 0 0 75px rgba(160, 140, 120, 0.06),
    inset 0 0 100px rgba(140, 120, 100, 0.04);
}

.planet-container[data-planet-id="venus"] .planet-halo {
  box-shadow: 
    0 0 20px rgba(255, 230, 200, 0.22),
    0 0 40px rgba(255, 210, 170, 0.16),
    0 0 60px rgba(255, 190, 140, 0.12),
    /* Внутрішні тіні для об'ємного теплого світіння */
    inset 0 0 25px rgba(255, 220, 180, 0.15),
    inset 0 0 50px rgba(255, 200, 160, 0.11),
    inset 0 0 75px rgba(255, 180, 140, 0.08),
    inset 0 0 100px rgba(255, 160, 120, 0.05);
}

.planet-container[data-planet-id="earth"] .planet-halo {
  box-shadow: 
    0 0 20px rgba(120, 170, 255, 0.25),
    0 0 40px rgba(100, 150, 255, 0.18),
    0 0 60px rgba(80, 130, 230, 0.12),
    0 0 80px rgba(60, 110, 200, 0.08),
    /* Внутрішні тіні для об'ємного блакитного світіння */
    inset 0 0 30px rgba(100, 150, 255, 0.15),
    inset 0 0 60px rgba(80, 130, 230, 0.11),
    inset 0 0 90px rgba(60, 110, 200, 0.08),
    inset 0 0 120px rgba(40, 90, 180, 0.05),
    inset 0 0 150px rgba(20, 70, 160, 0.03);
}

.planet-container[data-planet-id="mars"] .planet-halo {
  box-shadow: 
    0 0 20px rgba(255, 120, 100, 0.22),
    0 0 40px rgba(230, 100, 80, 0.16),
    0 0 60px rgba(200, 80, 60, 0.12),
    /* Внутрішні тіні для об'ємного червоного світіння */
    inset 0 0 25px rgba(230, 100, 80, 0.15),
    inset 0 0 50px rgba(200, 80, 60, 0.11),
    inset 0 0 75px rgba(180, 60, 40, 0.08),
    inset 0 0 100px rgba(160, 40, 20, 0.05);
}

.planet-container[data-planet-id="jupiter"] .planet-halo {
  box-shadow: 
    0 0 25px rgba(220, 180, 130, 0.22),
    0 0 50px rgba(200, 160, 110, 0.16),
    0 0 75px rgba(180, 140, 90, 0.12),
    /* Внутрішні тіні для об'ємного бежевого світіння */
    inset 0 0 30px rgba(200, 160, 110, 0.15),
    inset 0 0 60px rgba(180, 140, 90, 0.11),
    inset 0 0 90px rgba(160, 120, 70, 0.08),
    inset 0 0 120px rgba(140, 100, 50, 0.05),
    inset 0 0 150px rgba(120, 80, 30, 0.03);
}

.planet-container[data-planet-id="saturn"] .planet-halo {
  box-shadow: 
    0 0 25px rgba(255, 230, 200, 0.22),
    0 0 50px rgba(240, 210, 180, 0.16),
    0 0 75px rgba(220, 190, 160, 0.12),
    /* Внутрішні тіні для об'ємного золотистого світіння */
    inset 0 0 30px rgba(240, 210, 180, 0.15),
    inset 0 0 60px rgba(220, 190, 160, 0.11),
    inset 0 0 90px rgba(200, 170, 140, 0.08),
    inset 0 0 120px rgba(180, 150, 120, 0.05),
    inset 0 0 150px rgba(160, 130, 100, 0.03);
}

.planet-container[data-planet-id="uranus"] .planet-halo {
  box-shadow: 
    0 0 20px rgba(170, 220, 255, 0.22),
    0 0 40px rgba(150, 200, 245, 0.16),
    0 0 60px rgba(130, 180, 235, 0.12),
    /* Внутрішні тіні для об'ємного світло-блакитного світіння */
    inset 0 0 25px rgba(150, 200, 245, 0.15),
    inset 0 0 50px rgba(130, 180, 235, 0.11),
    inset 0 0 75px rgba(110, 160, 225, 0.08),
    inset 0 0 100px rgba(90, 140, 215, 0.05),
    inset 0 0 125px rgba(70, 120, 205, 0.03);
}

.planet-container[data-planet-id="neptune"] .planet-halo {
  box-shadow: 
    0 0 20px rgba(100, 150, 255, 0.26),
    0 0 40px rgba(80, 130, 235, 0.19),
    0 0 60px rgba(60, 110, 215, 0.13),
    0 0 80px rgba(50, 90, 195, 0.08),
    /* Внутрішні тіні для об'ємного синього світіння */
    inset 0 0 30px rgba(80, 130, 235, 0.15),
    inset 0 0 60px rgba(60, 110, 215, 0.11),
    inset 0 0 90px rgba(50, 90, 195, 0.08),
    inset 0 0 120px rgba(40, 70, 175, 0.05),
    inset 0 0 150px rgba(30, 50, 155, 0.03);
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

  transition: transform 0.4s ease, filter 0.4s ease;
  filter: brightness(1);
  
  /* Гарантуємо круглу форму відео */
  display: block;
}

.planet-wrapper:hover .planet-video {
  transform: translate(-50%, -50%) scale(1.15);
  filter: brightness(1.2);
  transform-origin: center center;
}

/* Анімація підстрибування */
@keyframes planetBounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-8px) scale(1);
  }
}

/* Анімація підстрибування гало - синхронізована з планетою */
@keyframes haloBounce {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-8px);
  }
}

/* Анімація пульсації гало - тонка, природна (тільки opacity та scale) */
@keyframes haloPulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.65;
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