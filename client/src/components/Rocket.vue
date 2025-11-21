<template>
  <div 
    v-if="isVisible" 
    class="rocket-container"
    :style="rocketStyle"
  >
    <!-- Ракета -->
    <div class="rocket" :class="{
      'rocket-landing': isLanding, 
      'rocket-flying': isFlying, 
      'rocket-hovering': !isLanding && !isFlying,
      'rocket-taking-off': isTakingOff,
      'rocket-landing-start': isLandingStart,
      'rocket-shake-increase': isShakeIncreasing,
      'rocket-shake-decrease': isShakeDecreasing
    }">
      <!-- Зображення ракети -->
      <img 
        :src="rocketImage" 
        alt="Ракета" 
        class="rocket-image"
      />
      
      <!-- Анімація двигуна (вогонь/полум'я) -->
      <div class="rocket-engine">
        <div class="flame flame-1"></div>
        <div class="flame flame-2"></div>
        <div class="flame flame-3"></div>
        <div class="spark spark-1"></div>
        <div class="spark spark-2"></div>
        <div class="spark spark-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import rocketImage from '../assets/images/rocket.png'

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
  },
  isFlying: {
    type: Boolean,
    default: false
  },
  isTakingOff: {
    type: Boolean,
    default: false
  },
  isLandingStart: {
    type: Boolean,
    default: false
  },
  isShakeIncreasing: {
    type: Boolean,
    default: false
  },
  isShakeDecreasing: {
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
  transform-origin: center bottom;
}

.rocket {
  position: relative;
  width: 60px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: center bottom;
}

.rocket-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  z-index: 2;
  position: relative;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  transition: transform 0.5s ease-out;
}

/* М'яка анімація левітації, коли ракета стоїть на місці */
.rocket-hovering .rocket-image {
  animation: rocketFloat 3s ease-in-out infinite;
}

/* Плавне збільшення трясіння при злеті (проміжна анімація) */
.rocket-taking-off .rocket-image {
  animation: rocketShakeLight 0.25s ease-in-out infinite;
}

/* Градієнтне збільшення трясіння при злеті (більша інтенсивність) */
.rocket-taking-off.rocket-shake-increase .rocket-image {
  animation: rocketShakeMedium 0.18s ease-in-out infinite;
}

/* Інтенсивне трясіння під час польоту */
.rocket-flying:not(.rocket-taking-off):not(.rocket-landing-start) .rocket-image {
  animation: rocketShake 0.12s ease-in-out infinite;
}

/* Плавне зменшення трясіння перед посадкою (проміжна анімація) */
.rocket-landing-start .rocket-image {
  animation: rocketShakeMedium 0.18s ease-in-out infinite;
}

/* Градієнтне зменшення трясіння перед посадкою (менша інтенсивність) */
.rocket-landing-start.rocket-shake-decrease .rocket-image {
  animation: rocketShakeLight 0.25s ease-in-out infinite;
}

/* М'яка анімація під час посадки */
.rocket-landing .rocket-image {
  animation: rocketFloat 2.5s ease-in-out infinite;
}

/* Анімація двигуна */
.rocket-engine {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 60px;
  z-index: 1;
  pointer-events: none;
  opacity: 1; /* Базова видимість */
}

.rocket-flying .rocket-engine {
  opacity: 1;
}

.rocket-landing .rocket-engine {
  opacity: 1;
  /* Плавний перехід прозорості */
  transition: opacity 0.6s ease-in-out;
}

/* Полум'я двигуна - мультяшний стиль */
.flame {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform-origin: center bottom;
  border-radius: 50% 50% 40% 40% / 70% 70% 30% 30%;
  pointer-events: none;
  opacity: 1; /* Базова видимість */
  /* Плавний перехід для розміру та прозорості */
  transition: width 0.5s ease-in-out, height 0.5s ease-in-out, opacity 0.5s ease-in-out;
}

/* Основне полум'я - велике, червоно-помаранчеве */
.flame-1 {
  width: 32px;
  height: 50px;
  background: radial-gradient(
    ellipse at center bottom,
    #ff9500 0%,
    #ff6b00 25%,
    #ff4500 45%,
    #ff0000 65%,
    transparent 80%
  );
  animation: cartoonFlameMain 0.25s ease-out infinite alternate;
  animation-delay: 0s;
  transform: translateX(-50%);
  box-shadow: 
    0 0 20px rgba(255, 149, 0, 1),
    0 0 30px rgba(255, 107, 0, 0.8),
    0 0 40px rgba(255, 69, 0, 0.6),
    0 0 50px rgba(255, 0, 0, 0.4);
  filter: blur(1px);
  /* Плавний перехід для розміру */
  transition: width 0.6s ease-in-out, height 0.6s ease-in-out, opacity 0.6s ease-in-out;
}


/* Внутрішнє полум'я - яскраво-жовте */
.flame-2 {
  width: 22px;
  height: 55px;
  background: radial-gradient(
    ellipse at center bottom,
    #ffff00 0%,
    #ffaa00 25%,
    #ff8800 45%,
    #ff4500 65%,
    transparent 85%
  );
  animation: cartoonFlameInner 0.2s ease-in-out infinite alternate;
  animation-delay: 0.05s;
  transform: translateX(-50%);
  box-shadow: 
    0 0 15px rgba(255, 255, 0, 1),
    0 0 25px rgba(255, 170, 0, 0.9),
    0 0 35px rgba(255, 136, 0, 0.7),
    0 0 45px rgba(255, 69, 0, 0.5);
  filter: blur(0.5px);
  /* Плавний перехід для розміру */
  transition: width 0.55s ease-in-out, height 0.55s ease-in-out, opacity 0.55s ease-in-out;
}


/* Зовнішнє полум'я - червоне */
.flame-3 {
  width: 38px;
  height: 45px;
  background: radial-gradient(
    ellipse at center bottom,
    #ff4500 0%,
    #ff6b00 25%,
    #ff8800 40%,
    #ff0000 60%,
    transparent 80%
  );
  animation: cartoonFlameOuter 0.3s ease-out infinite alternate;
  animation-delay: 0.1s;
  transform: translateX(-50%);
  opacity: 0.9;
  box-shadow: 
    0 0 25px rgba(255, 69, 0, 0.9),
    0 0 35px rgba(255, 107, 0, 0.7),
    0 0 45px rgba(255, 136, 0, 0.5),
    0 0 55px rgba(255, 0, 0, 0.3);
  filter: blur(1.5px);
  /* Плавний перехід для розміру */
  transition: width 0.65s ease-in-out, height 0.65s ease-in-out, opacity 0.65s ease-in-out;
}


/* Іскри для мультяшного ефекту - тільки під час польоту */
.spark {
  position: absolute;
  bottom: 10px;
  left: 50%;
  width: 4px;
  height: 4px;
  background: #ffff00;
  border-radius: 50%;
  pointer-events: none;
  box-shadow: 0 0 8px rgba(255, 255, 0, 1);
}

.rocket-flying .spark {
  opacity: 1;
}

.rocket-landing .spark {
  opacity: 0;
  display: none;
}

.spark-1 {
  animation: sparkJump1 0.4s ease-out infinite;
  transform: translateX(-50%);
}

.spark-2 {
  animation: sparkJump2 0.35s ease-out infinite;
  animation-delay: 0.15s;
  transform: translateX(-50%);
  background: #ff4500;
  box-shadow: 0 0 8px rgba(255, 69, 0, 1);
}

.spark-3 {
  animation: sparkJump3 0.45s ease-out infinite;
  animation-delay: 0.25s;
  transform: translateX(-50%);
  background: #ff6b00;
  box-shadow: 0 0 8px rgba(255, 107, 0, 1);
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

/* Мультяшні анімації полум'я - більш екстремальні та веселі */
@keyframes cartoonFlameMain {
  0% {
    transform: translateX(-50%) scaleY(1) scaleX(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) scaleY(1.8) scaleX(0.75);
    opacity: 0.95;
  }
}

@keyframes cartoonFlameInner {
  0% {
    transform: translateX(-50%) scaleY(1) scaleX(1) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) scaleY(2) scaleX(0.7) translateY(-5px);
    opacity: 0.9;
  }
}

@keyframes cartoonFlameOuter {
  0% {
    transform: translateX(-50%) scaleY(1) scaleX(1);
    opacity: 0.9;
  }
  50% {
    transform: translateX(-50%) scaleY(1.6) scaleX(0.8);
    opacity: 0.85;
  }
  100% {
    transform: translateX(-50%) scaleY(1.9) scaleX(0.7);
    opacity: 0.8;
  }
}

/* Анімації іскор - стрибучі */
@keyframes sparkJump1 {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateX(-30px) translateY(-25px) scale(1.5);
    opacity: 0.8;
  }
  100% {
    transform: translateX(-20px) translateY(-40px) scale(0.3);
    opacity: 0;
  }
}

@keyframes sparkJump2 {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateX(30px) translateY(-20px) scale(1.3);
    opacity: 0.9;
  }
  100% {
    transform: translateX(25px) translateY(-35px) scale(0.2);
    opacity: 0;
  }
}

@keyframes sparkJump3 {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
  33% {
    transform: translateX(-15px) translateY(-15px) scale(1.2);
    opacity: 0.85;
  }
  66% {
    transform: translateX(15px) translateY(-30px) scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: translateX(10px) translateY(-45px) scale(0.1);
    opacity: 0;
  }
}

/* М'яка анімація левітації (для спокою та посадки) */
@keyframes rocketFloat {
  0%, 100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  50% {
    transform: translateX(0.3px) translateY(-1px) rotate(0.2deg);
  }
}

/* Легке трясіння (для переходів) */
@keyframes rocketShakeLight {
  0%, 100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  25% {
    transform: translateX(0.6px) translateY(-0.6px) rotate(0.3deg);
  }
  50% {
    transform: translateX(-0.6px) translateY(0.6px) rotate(-0.3deg);
  }
  75% {
    transform: translateX(0.4px) translateY(-0.4px) rotate(0.2deg);
  }
}

/* Середнє трясіння (для переходів) */
@keyframes rocketShakeMedium {
  0%, 100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  12% {
    transform: translateX(1px) translateY(-1px) rotate(0.5deg);
  }
  25% {
    transform: translateX(-1px) translateY(1px) rotate(-0.5deg);
  }
  37% {
    transform: translateX(0.8px) translateY(-0.8px) rotate(0.4deg);
  }
  50% {
    transform: translateX(-0.8px) translateY(0.8px) rotate(-0.4deg);
  }
  62% {
    transform: translateX(0.9px) translateY(-0.9px) rotate(0.45deg);
  }
  75% {
    transform: translateX(-0.9px) translateY(0.9px) rotate(-0.45deg);
  }
  87% {
    transform: translateX(0.7px) translateY(-0.7px) rotate(0.35deg);
  }
}

/* Інтенсивне трясіння ракети під час польоту */
@keyframes rocketShake {
  0%, 100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  10% {
    transform: translateX(1.5px) translateY(-1.5px) rotate(0.8deg);
  }
  20% {
    transform: translateX(-1.5px) translateY(1.5px) rotate(-0.8deg);
  }
  30% {
    transform: translateX(1px) translateY(-1px) rotate(0.5deg);
  }
  40% {
    transform: translateX(-1px) translateY(1px) rotate(-0.5deg);
  }
  50% {
    transform: translateX(1.2px) translateY(-1.2px) rotate(0.6deg);
  }
  60% {
    transform: translateX(-1.2px) translateY(1.2px) rotate(-0.6deg);
  }
  70% {
    transform: translateX(0.8px) translateY(-0.8px) rotate(0.4deg);
  }
  80% {
    transform: translateX(-0.8px) translateY(0.8px) rotate(-0.4deg);
  }
  90% {
    transform: translateX(1px) translateY(-1px) rotate(0.5deg);
  }
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

@keyframes trajectoryDraw {
  from {
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
}
</style>

