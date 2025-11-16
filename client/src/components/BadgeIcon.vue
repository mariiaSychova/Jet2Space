<template>
  <div 
    class="badge-icon-container"
    @mouseenter="onHover"
    @mouseleave="onLeave"
    @click="onClick"
    :class="{ 'badge-hover': isHovered }"
    :title="'Бейдж астронавта - ви відвідали всі планети!'"
  >
    <img 
      src="../assets/images/Badge.svg" 
      alt="Бейдж астронавта" 
      class="badge-icon-image"
    />
    <div class="badge-icon-glow" :class="{ 'glow-active': isHovered }"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { playHover, playClick } from '../utils/sounds'

const emit = defineEmits(['click'])

const isHovered = ref(false)

function onHover() {
  isHovered.value = true
  playHover()
}

function onLeave() {
  isHovered.value = false
}

function onClick() {
  playClick()
  emit('click')
}
</script>

<style scoped>
.badge-icon-container {
  position: fixed;
  top: 20px;
  right: 90px; /* Праворуч від кнопки музики (60px + 20px gap + 10px) */
  width: 50px;
  height: 50px;
  cursor: pointer;
  z-index: 999; /* Трохи нижче кнопки музики (1000) */
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  z-index: 2;
  position: relative;
}

.badge-hover .badge-icon-image {
  transform: scale(1.15) rotate(5deg);
  filter: drop-shadow(0 4px 12px rgba(255, 198, 55, 0.6));
}

.badge-icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 198, 55, 0.4) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

.glow-active {
  opacity: 1;
  animation: iconGlowPulse 1.5s ease-in-out infinite;
}

@keyframes iconGlowPulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.4;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.7;
  }
}

/* Адаптивність */
@media (max-width: 768px) {
  .badge-icon-container {
    width: 40px;
    height: 40px;
    top: 15px;
    right: 70px; /* Праворуч від кнопки музики на мобільних */
  }

  .badge-icon-glow {
    width: 50px;
    height: 50px;
  }
}
</style>

