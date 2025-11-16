<template>
  <div 
    v-if="isVisible" 
    class="rocket-container"
    :style="rocketStyle"
  >
    <!-- Ракета -->
    <div class="rocket" :class="{ 'rocket-landing': isLanding }">
      <!-- Корпус ракети -->
      <div class="rocket-body">
        <div class="rocket-nose"></div>
        <div class="rocket-window"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  angle: {
    type: Number,
    default: 0 // у градусах
  },
  isVisible: {
    type: Boolean,
    default: false
  },
  isLanding: {
    type: Boolean,
    default: false
  }
})

const rocketStyle = computed(() => {
  return {
    left: `${props.x}px`,
    top: `${props.y}px`,
    transform: `translate(-50%, -100%) rotate(${props.angle}deg)`, // Нахил ракети по траєкторії
  }
})
</script>

<style scoped>
.rocket-container {
  position: absolute;
  z-index: 100;
  pointer-events: none;
  transform-origin: center center;
}

.rocket {
  position: relative;
  width: 40px;
  height: 80px;
  transition: transform 0.1s linear;
}

.rocket-body {
  position: relative;
  width: 100%;
  height: 70%;
  background: linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #606060 100%);
  border-radius: 20px 20px 5px 5px;
  box-shadow: 
    0 0 10px rgba(255, 255, 255, 0.3),
    inset 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.rocket-nose {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 15px solid #ff6b35;
  filter: drop-shadow(0 0 5px rgba(255, 107, 53, 0.6));
}

.rocket-window {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, #87ceeb 0%, #4682b4 100%);
  border: 2px solid #2c3e50;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
}

.rocket-flame {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 30px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rocket-flame.flame-active {
  opacity: 1;
}

.flame {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  filter: blur(3px);
}

.flame-1 {
  width: 15px;
  height: 20px;
  background: radial-gradient(ellipse at center, #ff6b35 0%, #ff8c42 40%, transparent 70%);
  animation: flamePulse 0.3s ease-in-out infinite;
  animation-delay: 0s;
}

.flame-2 {
  width: 12px;
  height: 25px;
  background: radial-gradient(ellipse at center, #ffd700 0%, #ff8c42 50%, transparent 80%);
  animation: flamePulse 0.3s ease-in-out infinite;
  animation-delay: 0.1s;
}

.flame-3 {
  width: 18px;
  height: 18px;
  background: radial-gradient(ellipse at center, #ff4500 0%, #ff6b35 40%, transparent 70%);
  animation: flamePulse 0.3s ease-in-out infinite;
  animation-delay: 0.2s;
}

.rocket-landing .rocket-flame {
  opacity: 0.5;
  transform: translateX(-50%) scale(0.5);
}

/* Траєкторія */
.trajectory-svg {
  pointer-events: none;
}

.trajectory-path {
  fill: none;
  stroke: rgba(100, 150, 255, 0.4);
  stroke-width: 2;
  stroke-dasharray: 10 5;
  filter: drop-shadow(0 0 3px rgba(100, 150, 255, 0.6));
  animation: trajectoryDraw 0.5s ease-out forwards;
}

@keyframes flamePulse {
  0%, 100% {
    transform: translateX(-50%) scaleY(1) scaleX(1);
    opacity: 0.8;
  }
  50% {
    transform: translateX(-50%) scaleY(1.2) scaleX(0.9);
    opacity: 1;
  }
}

@keyframes trajectoryDraw {
  from {
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* Анімація польоту */
.rocket-flying .rocket-body {
  animation: rocketShake 0.1s ease-in-out infinite;
}

@keyframes rocketShake {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(1px);
  }
}
</style>
