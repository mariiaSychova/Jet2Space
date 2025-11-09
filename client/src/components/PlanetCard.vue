<template>
  <Transition name="planet-card">
    <div v-if="isVisible" class="planet-card-overlay" @click.self="closeCard">
      <div class="planet-card" @click.stop>
        <!-- Close button -->
        <button class="close-button" @click="closeCard" aria-label="Закрити">
          <span>×</span>
        </button>

        <!-- Planet Header -->
        <div class="planet-card-header">
          <h2 class="planet-name">{{ planetData.name }}</h2>
          <div class="planet-decoration">
            <div 
              class="star-decoration" 
              v-for="i in 5" 
              :key="i"
              :style="{ '--i': i - 1 }"
            ></div>
          </div>
        </div>

        <!-- Planet Image/Animation -->
        <div class="planet-image-container">
          <video 
            v-if="planetAnimationPath"
            ref="planetVideo"
            :src="planetAnimationPath"
            class="planet-video"
            autoplay
            loop
            muted
            playsinline
          ></video>
          <img 
            v-else-if="planetData.image && planetData.image !== '/images/...'" 
            :src="planetData.image" 
            :alt="planetData.name"
            class="planet-image"
          />
          <div v-else class="planet-placeholder">
            <div class="planet-circle"></div>
          </div>
        </div>

        <!-- Planet Description -->
        <div class="planet-card-content-wrapper">
        <div class="planet-card-content">
          <div class="description-section">
            <h3 class="section-title">
              <span class="icon">📖</span>
              Про планету
            </h3>
            <p class="description-text">{{ planetData.description }}</p>
          </div>

          <!-- Interesting Facts -->
          <div v-if="planetData.facts && planetData.facts.length > 0" class="facts-section">
            <h3 class="section-title">
              <span class="icon">✨</span>
              Цікаві факти
            </h3>
            <ul class="facts-list">
              <li v-for="(fact, index) in planetData.facts" :key="index" class="fact-item">
                {{ fact }}
              </li>
            </ul>
          </div>

          <!-- Media Section -->
          <div class="media-section" v-if="hasMedia">
            <h3 class="section-title">
              <span class="icon">🎬</span>
              Медіа
            </h3>
            <div class="media-buttons">
              <button v-if="planetData.video && planetData.video !== 'https://'" 
                      class="media-button video-button" 
                      @click="openVideo">
                <span>🎥</span> Відео
              </button>
              <button v-if="planetData.sound && planetData.sound !== '/sounds/...'" 
                      class="media-button sound-button" 
                      @click="playSound">
                <span>🔊</span> Звук
              </button>
            </div>
          </div>

          <!-- Quiz Section -->
          <div v-if="planetData.quiz && planetData.quiz.length > 0" class="quiz-section">
            <h3 class="section-title">
              <span class="icon">🧩</span>
              Вікторина
            </h3>
            <div class="quiz-preview">
              <p>{{ planetData.quiz.length }} питань готових до проходження!</p>
              <button class="quiz-button" @click="startQuiz">
                Почати вікторину →
              </button>
            </div>
          </div>
        </div>
        </div>

        <!-- Decorative elements -->
        <div class="card-decoration">
          <div class="decoration-circle decoration-circle-1"></div>
          <div class="decoration-circle decoration-circle-2"></div>
          <div class="decoration-circle decoration-circle-3"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { planets } from '../data/planets'

const props = defineProps({
  planetData: {
    type: Object,
    required: true,
  },
  planetId: {
    type: String,
    default: null,
  },
  isVisible: {
    type: Boolean,
    default: false,
  },
})

const planetVideo = ref(null)

const planetAnimationPath = computed(() => {
  if (!props.planetId) return null
  const planet = planets.find(p => p.id === props.planetId)
  return planet?.animationPath || null
})

const emit = defineEmits(['close'])

const hasMedia = computed(() => {
  return (props.planetData.video && props.planetData.video !== 'https://') ||
         (props.planetData.sound && props.planetData.sound !== '/sounds/...')
})

function closeCard() {
  emit('close')
}

function handleEscape(event) {
  if (event.key === 'Escape' && props.isVisible) {
    closeCard()
  }
}

function openVideo() {
  if (props.planetData.video && props.planetData.video !== 'https://') {
    window.open(props.planetData.video, '_blank')
  }
}

function playSound() {
  if (props.planetData.sound && props.planetData.sound !== '/sounds/...') {
    const audio = new Audio(props.planetData.sound)
    audio.play().catch(error => console.error('Помилка відтворення звуку:', error))
  }
}

function startQuiz() {
  // TODO: Implement quiz functionality
  console.log('Quiz started for', props.planetData.name)
}

// Додаємо обробник для клавіші ESC
watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    document.addEventListener('keydown', handleEscape)
    // Автоматично відтворюємо відео при відкритті картки
    setTimeout(() => {
      if (planetVideo.value && planetAnimationPath.value) {
        planetVideo.value.play().catch(error => console.error('Video play failed:', error))
      }
    }, 100)
  } else {
    document.removeEventListener('keydown', handleEscape)
    // Зупиняємо відео при закритті картки
    if (planetVideo.value) {
      planetVideo.value.pause()
    }
  }
})

// Також відтворюємо відео при зміні planetId
watch(() => props.planetId, () => {
  if (props.isVisible && planetVideo.value && planetAnimationPath.value) {
    setTimeout(() => {
      planetVideo.value?.play().catch(error => console.error('Video play failed:', error))
    }, 100)
  }
})

onMounted(() => {
  if (props.isVisible) {
    document.addEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
/* Грайливі шрифти */
.planet-card-overlay {
  font-family: 'Nunito', sans-serif;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

.planet-card {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 30px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 3px rgba(255, 255, 255, 0.1),
    inset 0 0 50px rgba(100, 150, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.planet-card-content-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  /* Додаємо відступи, щоб контент не торкався країв */
  padding-top: 10px;
  padding-bottom: 10px;
  /* Відступ для скролбара */
  padding-right: 5px;
  margin-right: -5px;
}

.planet-card-content-wrapper::-webkit-scrollbar {
  width: 8px;
}

.planet-card-content-wrapper::-webkit-scrollbar-track {
  background: transparent;
  margin: 10px 0;
}

.planet-card-content-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.planet-card-content-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.close-button {
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

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.planet-card-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.planet-name {
  font-family: 'Fredoka One', cursive;
  font-size: 2.5rem;
  font-weight: 400;
  color: #fff;
  margin: 0 0 15px 0;
  text-shadow: 
    0 0 20px rgba(100, 150, 255, 0.8),
    0 4px 10px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
  animation: glow 2s ease-in-out infinite alternate;
}

.planet-decoration {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.star-decoration {
  width: 12px;
  height: 12px;
  background: #ffd700;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  animation: twinkle 2s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.2s);
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.8));
}

.planet-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 30px 0;
  height: 200px;
  flex-shrink: 0;
}

.planet-video {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(100, 150, 255, 0.4);
  animation: float 3s ease-in-out infinite;
  background: transparent;
}

.planet-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: float 3s ease-in-out infinite;
}

.planet-placeholder {
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.planet-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(100, 150, 255, 0.3), rgba(255, 100, 150, 0.3));
  box-shadow: 
    0 0 30px rgba(100, 150, 255, 0.5),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
  animation: pulse 2s ease-in-out infinite;
}

.planet-card-content {
  color: #e0e0e0;
  line-height: 1.8;
}

.description-section,
.facts-section,
.media-section,
.quiz-section {
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.description-section:hover,
.facts-section:hover,
.media-section:hover,
.quiz-section:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-family: 'Nunito', sans-serif;
  font-size: 1.3rem;
  color: #fff;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.icon {
  font-size: 1.5rem;
  animation: bounce 2s ease-in-out infinite;
}

.description-text {
  font-family: 'Nunito', sans-serif;
  font-size: 1rem;
  line-height: 1.8;
  color: #d0d0d0;
  margin: 0;
  font-weight: 400;
}

.facts-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.fact-item {
  font-family: 'Nunito', sans-serif;
  padding: 12px 0;
  padding-left: 30px;
  position: relative;
  font-size: 1rem;
  color: #e0e0e0;
  line-height: 1.6;
  font-weight: 400;
}

.fact-item::before {
  content: '⭐';
  position: absolute;
  left: 0;
  top: 12px;
  font-size: 1.2rem;
  animation: rotate 3s linear infinite;
}

.fact-item:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.media-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.media-button {
  font-family: 'Nunito', sans-serif;
  flex: 1;
  min-width: 120px;
  padding: 15px 25px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.media-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 5px 20px rgba(100, 150, 255, 0.4);
}

.video-button:hover {
  border-color: #ff6b6b;
  box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4);
}

.sound-button:hover {
  border-color: #4ecdc4;
  box-shadow: 0 5px 20px rgba(78, 205, 196, 0.4);
}

.quiz-section {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));
  border-color: rgba(255, 215, 0, 0.3);
}

.quiz-preview {
  font-family: 'Nunito', sans-serif;
  text-align: center;
}

.quiz-preview p {
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
}

.quiz-button {
  font-family: 'Nunito', sans-serif;
  margin-top: 15px;
  padding: 15px 30px;
  border: 2px solid #ffd700;
  border-radius: 25px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2));
  color: #ffd700;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quiz-button:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 165, 0, 0.4));
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 5px 25px rgba(255, 215, 0, 0.5);
}

.card-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 30px;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(100, 150, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.decoration-circle-1 {
  width: 100px;
  height: 100px;
  top: -50px;
  right: -50px;
  animation-delay: 0s;
}

.decoration-circle-2 {
  width: 80px;
  height: 80px;
  bottom: -40px;
  left: -40px;
  animation-delay: 2s;
}

.decoration-circle-3 {
  width: 60px;
  height: 60px;
  top: 50%;
  right: 10%;
  animation-delay: 4s;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: scale(0.7) translateY(50px) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0) rotate(0deg);
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

@keyframes twinkle {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Transition animations */
.planet-card-enter-active {
  transition: opacity 0.3s ease;
}

.planet-card-leave-active {
  transition: opacity 0.3s ease;
}

.planet-card-enter-active .planet-card {
  animation: cardSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.planet-card-leave-active .planet-card {
  animation: cardSlideOut 0.3s ease-in;
}

.planet-card-enter-from {
  opacity: 0;
}

.planet-card-leave-to {
  opacity: 0;
}

@keyframes cardSlideOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0) rotate(0deg);
  }
  to {
    opacity: 0;
    transform: scale(0.8) translateY(30px) rotate(5deg);
  }
}

@media (max-width: 768px) {
  .planet-card {
    padding: 30px 20px;
    max-width: 95%;
  }

  .planet-name {
    font-size: 2rem;
  }

  .media-buttons {
    flex-direction: column;
  }

  .media-button {
    width: 100%;
  }
}
</style>
