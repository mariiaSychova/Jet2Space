<template>
  <Transition name="badge-overlay">
    <div v-if="isVisible" class="badge-overlay" @click="closeBadge">
      <div class="badge-container" @click.stop>
        <!-- Закриваюча кнопка -->
        <button class="close-badge-button" @click="closeBadge" aria-label="Закрити">
          <span>×</span>
        </button>
        
        <!-- Текст привітання -->
        <div class="congratulations-text">
          <h2 class="congratulations-title">Вітаємо!</h2>
          <p class="congratulations-subtitle">Ви заслуговуєте на бейдж астронавта!</p>
        </div>
        
        <!-- Бейдж з анімацією -->
        <div class="badge-wrapper" @mouseenter="onHover" @mouseleave="onLeave">
          <img 
            src="../assets/images/Badge.svg" 
            alt="Бейдж астронавта" 
            class="badge-image"
            :class="{ 'badge-hover': isHovered }"
          />
          <!-- Ефект світіння при наведенні -->
          <div class="badge-glow" :class="{ 'glow-active': isHovered }"></div>
        </div>
        
        <!-- Опис досягнення -->
        <div class="achievement-description">
          <p>Ви відвідали всі планети Сонячної системи та успішно пройшли всі тести!</p>
          <p class="achievement-subtext">Тепер ви справжній космічний дослідник! 🚀</p>
        </div>
        
        <!-- Зірки на фоні -->
        <div class="badge-stars">
          <div 
            v-for="star in stars" 
            :key="star.id"
            class="star"
            :style="{
              left: star.x + '%',
              top: star.y + '%',
              animationDelay: star.delay + 's',
              animationDuration: star.duration + 's'
            }"
          ></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { playClick, playHover } from '../utils/sounds'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const isHovered = ref(false)

// Генеруємо зірки для анімації
const stars = ref([])
for (let i = 0; i < 30; i++) {
  stars.value.push({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3
  })
}

function onHover() {
  isHovered.value = true
  playHover()
}

function onLeave() {
  isHovered.value = false
}

function closeBadge() {
  playClick()
  emit('close')
}

// Закриваємо при натисканні ESC
const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isVisible) {
    closeBadge()
  }
}

watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    document.addEventListener('keydown', handleEscape)
  } else {
    document.removeEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.badge-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
}

.badge-container {
  position: relative;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 30%, #16213e 60%, #0f3460 100%);
  border-radius: 30px;
  padding: 60px 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.8),
    0 0 0 3px rgba(255, 255, 255, 0.1),
    inset 0 0 50px rgba(100, 150, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.close-badge-button {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.close-badge-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.congratulations-text {
  text-align: center;
  margin-bottom: 30px;
  z-index: 2;
  position: relative;
}

.congratulations-title {
  font-family: 'Fredoka One', cursive;
  font-size: 2.5rem;
  font-weight: 400;
  color: #fff;
  margin: 0 0 10px 0;
  text-shadow: 
    0 0 20px rgba(100, 150, 255, 0.8),
    0 4px 10px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
  animation: glow 2s ease-in-out infinite alternate;
}

.congratulations-subtitle {
  font-family: 'Nunito', sans-serif;
  font-size: 1.2rem;
  color: #e0e0e0;
  margin: 0;
}

.badge-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 40px 0;
  z-index: 2;
}

.badge-image {
  width: 100%;
  max-width: 300px;
  height: auto;
  transition: all 0.5s ease;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5));
  animation: badgeAppear 1s ease-out, badgeFloat 3s ease-in-out infinite 1s;
  transform-origin: center;
}

.badge-hover {
  transform: scale(1.1) rotate(5deg);
  filter: drop-shadow(0 15px 40px rgba(255, 198, 55, 0.6));
}

.badge-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 350px;
  height: 350px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 198, 55, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
  z-index: -1;
}

.glow-active {
  opacity: 1;
  animation: glowPulse 2s ease-in-out infinite;
}

.achievement-description {
  text-align: center;
  margin-top: 30px;
  z-index: 2;
  position: relative;
}

.achievement-description p {
  font-family: 'Nunito', sans-serif;
  font-size: 1.1rem;
  color: #e0e0e0;
  line-height: 1.8;
  margin: 10px 0;
}

.achievement-subtext {
  font-size: 1rem;
  color: #ffc637;
  font-weight: 600;
}

.badge-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
  border-radius: 30px;
}

.star {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  box-shadow: 
    0 0 2px rgba(255, 255, 255, 0.9),
    0 0 4px rgba(255, 255, 255, 0.7),
    0 0 6px rgba(150, 180, 255, 0.5);
  animation: starTwinkle infinite ease-in-out;
  opacity: 0.6;
}

@keyframes badgeAppear {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-180deg);
  }
  60% {
    transform: scale(1.1) rotate(10deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes badgeFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes glow {
  from {
    text-shadow: 
      0 0 20px rgba(100, 150, 255, 0.8),
      0 4px 10px rgba(0, 0, 0, 0.5);
  }
  to {
    text-shadow: 
      0 0 30px rgba(100, 150, 255, 1),
      0 4px 15px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(100, 150, 255, 0.6);
  }
}

@keyframes glowPulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.6;
  }
}

@keyframes starTwinkle {
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

/* Перехідні анімації */
.badge-overlay-enter-active {
  transition: opacity 0.5s ease;
}

.badge-overlay-leave-active {
  transition: opacity 0.5s ease;
}

.badge-overlay-enter-from,
.badge-overlay-leave-to {
  opacity: 0;
}

.badge-overlay-enter-active .badge-container {
  animation: badgeSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.badge-overlay-leave-active .badge-container {
  animation: badgeSlideOut 0.4s ease-in;
}

@keyframes badgeSlideIn {
  from {
    opacity: 0;
    transform: scale(0.7) translateY(50px) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0) rotate(0deg);
  }
}

@keyframes badgeSlideOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0) rotate(0deg);
  }
  to {
    opacity: 0;
    transform: scale(0.8) translateY(30px) rotate(5deg);
  }
}

/* Адаптивність */
@media (max-width: 768px) {
  .badge-container {
    padding: 40px 20px;
    max-width: 95%;
  }

  .congratulations-title {
    font-size: 2rem;
  }

  .congratulations-subtitle {
    font-size: 1rem;
  }

  .badge-image {
    max-width: 200px;
  }

  .achievement-description p {
    font-size: 0.9rem;
  }
}
</style>

