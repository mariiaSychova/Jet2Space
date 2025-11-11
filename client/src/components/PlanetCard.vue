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

        <!-- Planet Video -->
        <div class="planet-image-container">
          <div v-if="isYouTubeVideo" class="planet-video-wrapper">
            <iframe 
              :src="youtubeEmbedUrl"
              class="planet-video-iframe"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
          <video 
            v-else-if="planetVideoUrl"
            ref="planetVideo"
            :src="planetVideoUrl"
            class="planet-video"
            autoplay
            loop
            muted
            playsinline
            controls
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

        <!-- Starry background -->
        <div class="stars-background">
          <div 
            v-for="star in stars" 
            :key="star.id"
            class="star"
            :style="{
              left: star.x + '%',
              top: star.y + '%',
              width: star.size + 'px',
              height: star.size + 'px',
              animationDelay: star.delay + 's',
              animationDuration: star.duration + 's'
            }"
          ></div>
          
          <!-- Constellation lines -->
          <svg class="constellation-lines" xmlns="http://www.w3.org/2000/svg">
            <line 
              v-for="(line, index) in constellationLines" 
              :key="index"
              :x1="line.x1 + '%'"
              :y1="line.y1 + '%'"
              :x2="line.x2 + '%'"
              :y2="line.y2 + '%'"
              class="constellation-line"
              :style="{ '--line-delay': index * 0.15 + 's' }"
            />
          </svg>
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

// Функція для визначення, чи це YouTube посилання
function isYouTubeLink(url) {
  if (!url) return false
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/
  return youtubeRegex.test(url)
}

// Функція для конвертації YouTube посилання в embed формат
function convertToYouTubeEmbed(url) {
  if (!url) return null
  
  // Вже embed посилання
  if (url.includes('youtube.com/embed/')) {
    return url
  }
  
  // Коротке посилання youtu.be
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&loop=1&playlist=${shortMatch[1]}&mute=1`
  }
  
  // Звичайне YouTube посилання
  const regularMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/v\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  if (regularMatch) {
    return `https://www.youtube.com/embed/${regularMatch[1]}?autoplay=1&loop=1&playlist=${regularMatch[1]}&mute=1`
  }
  
  return null
}

const planetVideoUrl = computed(() => {
  if (props.planetData.video && props.planetData.video !== 'https://' && !isYouTubeLink(props.planetData.video)) {
    return props.planetData.video
  }
  return null
})

const isYouTubeVideo = computed(() => {
  return props.planetData.video && props.planetData.video !== 'https://' && isYouTubeLink(props.planetData.video)
})

const youtubeEmbedUrl = computed(() => {
  if (isYouTubeVideo.value) {
    return convertToYouTubeEmbed(props.planetData.video)
  }
  return null
})

// Генерація зірок для фону
const stars = ref([])
const constellationLines = ref([
  // Сузір'я 1 (Великий Віз)
  { x1: 15, y1: 20, x2: 25, y2: 25 },
  { x1: 25, y1: 25, x2: 35, y2: 20 },
  { x1: 35, y1: 20, x2: 45, y2: 30 },
  { x1: 25, y1: 25, x2: 30, y2: 35 },
  // Сузір'я 2 (Оріон)
  { x1: 60, y1: 15, x2: 70, y2: 20 },
  { x1: 70, y1: 20, x2: 75, y2: 30 },
  { x1: 65, y1: 25, x2: 72, y2: 35 },
  // Сузір'я 3 (Кассіопея)
  { x1: 20, y1: 60, x2: 30, y2: 65 },
  { x1: 30, y1: 65, x2: 40, y2: 60 },
  { x1: 40, y1: 60, x2: 35, y2: 70 },
  { x1: 30, y1: 65, x2: 25, y2: 75 },
])

// Функція для генерації випадкової зірки
function generateStar(id) {
  return {
    id: id,
    x: Math.random() * 95 + 2.5, // 2.5-97.5% щоб не виходили за межі
    y: Math.random() * 95 + 2.5,
    size: Math.random() * 2.5 + 0.8, // 0.8-3.3px
    delay: Math.random() * 4, // різні затримки для різноманітності
    duration: Math.random() * 2.5 + 1.8, // 1.8-4.3s - різні швидкості блимання
  }
}

// Генеруємо зірки при монтуванні або коли картка стає видимою
watch(() => props.isVisible, (isVisible) => {
  if (isVisible && stars.value.length === 0) {
    // Генеруємо ~100 зірок для красивого та живого фону
    stars.value = Array.from({ length: 100 }, (_, i) => generateStar(i))
  }
})

// Генеруємо зірки при монтуванні
onMounted(() => {
  if (props.isVisible) {
    stars.value = Array.from({ length: 100 }, (_, i) => generateStar(i))
  }
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
    // Автоматично відтворюємо відео при відкритті картки (тільки для звичайних video, не YouTube)
    if (!isYouTubeVideo.value) {
      setTimeout(() => {
        if (planetVideo.value && planetVideoUrl.value) {
          planetVideo.value.play().catch(error => console.error('Video play failed:', error))
        }
      }, 100)
    }
  } else {
    document.removeEventListener('keydown', handleEscape)
    // Зупиняємо відео при закритті картки (тільки для звичайних video, не YouTube)
    if (planetVideo.value && !isYouTubeVideo.value) {
      planetVideo.value.pause()
    }
  }
})

// Також відтворюємо відео при зміні planetData (тільки для звичайних video, не YouTube)
watch(() => props.planetData.video, () => {
  if (props.isVisible && !isYouTubeVideo.value && planetVideo.value && planetVideoUrl.value) {
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
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 30%, #16213e 60%, #0f3460 100%);
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

/* Starry background */
.stars-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  border-radius: 30px;
  overflow: hidden;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  box-shadow: 
    0 0 2px rgba(255, 255, 255, 0.9),
    0 0 4px rgba(255, 255, 255, 0.7),
    0 0 6px rgba(150, 180, 255, 0.5),
    0 0 8px rgba(100, 150, 255, 0.3);
  animation: twinkleStar infinite ease-in-out;
  opacity: 0.4;
  transform-origin: center;
}

/* Більші зірки мають інтенсивніше світіння */
.star:nth-child(4n) {
  box-shadow: 
    0 0 3px rgba(255, 255, 255, 1),
    0 0 6px rgba(255, 255, 255, 0.8),
    0 0 9px rgba(150, 180, 255, 0.6),
    0 0 12px rgba(100, 150, 255, 0.4);
}

/* Деякі зірки мають тепліший відтінок */
.star:nth-child(7n) {
  box-shadow: 
    0 0 2px rgba(255, 220, 150, 0.9),
    0 0 4px rgba(255, 200, 100, 0.7),
    0 0 6px rgba(255, 180, 80, 0.5);
  background: rgba(255, 240, 200, 0.9);
}

/* Констеляції */
.constellation-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.constellation-line {
  stroke: rgba(150, 180, 255, 0.5);
  stroke-width: 1;
  stroke-dasharray: 3, 3;
  fill: none;
  animation: drawConstellation 3s ease-in-out forwards;
  animation-delay: var(--line-delay, 0s);
  opacity: 0;
  filter: drop-shadow(0 0 2px rgba(150, 180, 255, 0.3));    
}

@keyframes drawConstellation {
  0% {
    stroke-dashoffset: 20;
    opacity: 0;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0.35;
  }
}

@keyframes twinkleStar {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.7);
  }
  25% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
  75% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.planet-card-content-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 10px;
  padding-bottom: 10px;
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
  backdrop-filter: blur(5px);
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
  z-index: 2;
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
  min-height: 300px;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.planet-video {
  width: 100%;
  max-width: 560px;
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: 15px;
  object-fit: contain;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(100, 150, 255, 0.4);
  background: transparent;
}

.planet-video-wrapper {
  width: 100%;
  max-width: 560px;
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(100, 150, 255, 0.4);
  position: relative;
}

.planet-video-iframe {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  top: 0;
  left: 0;
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
  position: relative;
  z-index: 2;
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
