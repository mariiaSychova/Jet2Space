<template>
  <StarryBackground @stars-ready="onStarsReady" />
  <!-- Кнопка вмикання/вимикання музики -->
  <button 
    class="music-toggle-button" 
    @click="toggleMusic"
    @mouseenter="playHover"
    :aria-label="isMusicPlaying ? 'Вимкнути музику' : 'Увімкнути музику'"
    :class="{ 'music-playing': isMusicPlaying }"
  >
    <span class="music-icon" v-if="!isMusicPlaying">🔇</span>
    <span class="music-waves" v-if="isMusicPlaying">
      <span class="wave wave-1"></span>
      <span class="wave wave-2"></span>
      <span class="wave wave-3"></span>
    </span>
  </button>
  <div class="app-content">
    <RouterView />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import StarryBackground from './components/StarryBackground.vue'
import { playBackground, stopBackground, getBackgroundState, playHover, playClick } from './utils/sounds.js'

const starsReady = ref(false)
const isMusicPlaying = ref(false)

function onStarsReady() {
  starsReady.value = true
}

// Надаємо starsReady через provide для доступу в дочірніх компонентах
provide('starsReady', starsReady)

async function startAudio() {
  try {
    await playBackground()
    // Оновлюємо стан після успішного запуску
    isMusicPlaying.value = getBackgroundState()
  } catch (error) {
    console.error('Failed to start background music:', error)
    isMusicPlaying.value = false
  }
}

async function toggleMusic() {
  playClick()
  
  // Отримуємо актуальний стан
  const currentState = getBackgroundState()
  
  if (currentState) {
    // Музика грає - вимикаємо
    stopBackground()
    // Оновлюємо стан одразу після зупинки
    isMusicPlaying.value = false
  } else {
    // Музика не грає - вмикаємо
    await startAudio()
    // Стан оновлюється в startAudio, але перевіримо ще раз
    isMusicPlaying.value = getBackgroundState()
  }
}

// Намагаємося запустити музику автоматично при завантаженні сторінки
onMounted(() => {
  // Спочатку намагаємося запустити музику автоматично
  // (невелика затримка дає час на завантаження сторінки)
  setTimeout(() => {
    startAudio()
  }, 100)
  
  // Якщо браузер заблокував автоплей, додаємо fallback - запуск після першої взаємодії
  const handleFirstInteraction = () => {
    startAudio()
  }
  
  // Додаємо обробники для різних типів взаємодії як резервний варіант
  // Використовуємо { once: true }, щоб обробники видалилися після першої взаємодії
  document.addEventListener('click', handleFirstInteraction, { once: true })
  document.addEventListener('touchstart', handleFirstInteraction, { once: true })
  document.addEventListener('keydown', handleFirstInteraction, { once: true })
})
</script>

<style>
.app-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

/* Кнопка вмикання/вимикання музики */
.music-toggle-button {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid rgba(100, 150, 255, 0.5);
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(100, 150, 255, 0.2);
  backdrop-filter: blur(10px);
  overflow: visible;
}

.music-toggle-button:hover {
  background: rgba(26, 26, 46, 0.95);
  border-color: rgba(100, 150, 255, 0.8);
  transform: scale(1.1);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(100, 150, 255, 0.4);
}

.music-toggle-button.music-playing {
  border-color: rgba(100, 150, 255, 0.8);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 25px rgba(100, 150, 255, 0.4);
  animation: musicPulse 2s ease-in-out infinite;
}

.music-toggle-button.music-playing:hover {
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(100, 150, 255, 0.6);
}

.music-icon {
  position: relative;
  z-index: 3;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.music-toggle-button:hover .music-icon {
  transform: scale(1.1);
}

.music-waves {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  pointer-events: none;
  z-index: 2;
}

.wave {
  width: 4px;
  height: 14px;
  background: rgba(100, 150, 255, 0.9);
  border-radius: 2px;
  animation: waveAnimation 1s ease-in-out infinite;
  box-shadow: 0 0 4px rgba(100, 150, 255, 0.6);
}

.wave-1 {
  animation-delay: 0s;
  height: 10px;
}

.wave-2 {
  animation-delay: 0.15s;
  height: 18px;
}

.wave-3 {
  animation-delay: 0.3s;
  height: 12px;
}

@keyframes musicPulse {
  0%, 100% {
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.3),
      0 0 25px rgba(100, 150, 255, 0.4);
  }
  50% {
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.3),
      0 0 35px rgba(100, 150, 255, 0.6);
  }
}

@keyframes waveAnimation {
  0%, 100% {
    transform: scaleY(0.4);
    opacity: 0.6;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* Адаптивність для мобільних пристроїв */
@media (max-width: 768px) {
  .music-toggle-button {
    width: 50px;
    height: 50px;
    top: 15px;
    right: 15px;
    font-size: 20px;
  }
  
  .wave {
    width: 3px;
    height: 8px;
  }
  
  .wave-1 {
    height: 6px;
  }
  
  .wave-2 {
    height: 12px;
  }
  
  .wave-3 {
    height: 8px;
  }
}
</style>