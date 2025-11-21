<template>
  <Transition name="planet-card">
    <div v-if="isVisible" class="planet-card-overlay" @click.self="closeCard">
      <div class="planet-card" @click.stop>
        <!-- Close button -->
        <button class="close-button" @mouseenter="playHover" @click="() => { playClick(); closeCard(); }" aria-label="Закрити">
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
            loop
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
            <!-- Photo Gallery -->
            <div class="media-photo-container">
              <img 
                v-if="hasImage"
                :src="planetData.image" 
                :alt="planetData.name"
                class="media-photo"
              />
              <div v-else class="media-photo-placeholder">
                <div class="placeholder-icon">📷</div>
                <p class="placeholder-text">Фото планеті</p>
              </div>
            </div>
            <!-- Media Buttons -->
            <div class="media-buttons" v-if="planetData.sound && planetData.sound !== '/sounds/...'">
              <button 
                class="media-button sound-button" 
                @mouseenter="playHover"
                @click="() => { playClick(); playSound(); }">
                <span>🔊</span> Звук
              </button>
            </div>
          </div>

          <!-- Quiz Section -->
          <div v-if="shouldShowQuizSection" class="quiz-section" ref="quizSectionRef">
            <h3 class="section-title">
              <span class="icon">🧩</span>
              Вікторина
            </h3>
            
            <!-- Екран завантаження -->
            <div v-if="isQuizLoading" class="quiz-loading">
              <div class="loading-spinner"></div>
              <p class="loading-text">Генеруємо питання для тесту...</p>
            </div>
            
            <!-- Контент вікторини -->
            <div v-else-if="currentQuestion" class="quiz-content" ref="quizContentRef" :key="`quiz-${currentQuestion.question}-${Date.now()}`">
              <p class="quiz-question">{{ currentQuestion.question }}</p>
              <div class="quiz-options">
                <button
                  v-for="(option, key) in currentQuestion.options"
                  :key="key"
                  :data-key="key"
                  class="quiz-option"
                  :class="{
                    'selected': selectedAnswer === key,
                    'correct': isAnswered && (attemptsLeft === 0 || isCorrect) && key === currentQuestion.answer,
                    'incorrect': isAnswered && selectedAnswer === key && !isCorrect,
                    'disabled': isAnswered && (attemptsLeft === 0 || isCorrect)
                  }"
                  @click.stop="handleAnswerClick(key, $event)"
                  :disabled="isAnswered && (attemptsLeft === 0 || isCorrect)"
                >
                  <span class="option-label">{{ key.toUpperCase() }}.</span>
                  <span class="option-text">{{ option }}</span>
                </button>
              </div>
              <div v-if="isAnswered" class="quiz-result">
                <p v-if="isCorrect" class="result-message correct-message">
                  ✅ Правильно! Відмінна робота!
                </p>
                <p v-else-if="attemptsLeft > 0" class="result-message incorrect-message">
                  ❌ Неправильно. У тебе залишилося {{ attemptsLeft }} {{ attemptsLeft === 1 ? 'спроба' : 'спроби' }}.
                </p>
                <p v-else class="result-message incorrect-message">
                  ❌ Неправильно. Правильна відповідь: {{ currentQuestion.options[currentQuestion.answer] }}
                </p>
              </div>
              
              <!-- Кнопка перезавантаження та інформація про спроби -->
              <div class="quiz-controls">
                <div v-if="attemptsLeft > 0 && !isCorrect && isAnswered" class="quiz-attempts-info">
                  <span class="attempts-text">Спроби: {{ 2 - attemptsLeft + 1 }}/2</span>
                </div>
                <button 
                  v-if="isAnswered && (attemptsLeft === 0 || isCorrect)" 
                  class="quiz-reset-button"
                  @mouseenter="playHover"
                  @click="handleResetQuiz"
                >
                  <span>🔄</span> Спробувати ще раз
                </button>
              </div>
              
              <!-- Таймер -->
              <div v-if="timeRemaining > 0 && !isAnswered" class="quiz-timer">
                <div class="timer-bar" :style="{ width: Math.max(0, Math.min(100, (timeRemaining / 30) * 100)) + '%' }"></div>
                <span class="timer-text">{{ Math.ceil(timeRemaining) }}с</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- Starry background -->
        <div class="stars-background">
          <!-- Статичні зірки через CSS градієнти (дуже швидко) -->
          <div class="stars-layer" :style="{ backgroundImage: starPattern }"></div>
          
          <!-- Тільки невелика кількість анімованих зірок -->
          <div 
            v-for="star in animatedStars" 
            :key="star.id"
            class="animated-star"
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
import { computed, ref, onMounted, onUnmounted, watch, nextTick, inject } from 'vue'
import { getCachedStars, getCachedAnimatedStars } from '../utils/starBackground.js'
import { getRandomQuestionFromQuiz, validateQuizResponse, updateUserProgress, checkUserForBadge } from '../utils/logic.js'
import { galaxyConfig } from '../utils/data.js'
import { playHover, playClick } from '../utils/sounds'

// Отримуємо посилання на Stella через inject
const stella = inject('stella', null)

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

const emit = defineEmits(['close', 'badge-earned', 'update-planet-data'])

const planetVideo = ref(null)
const quizContentRef = ref(null)
const quizSectionRef = ref(null)
const isQuizSectionVisible = ref(false)
const isGeneratingNewQuestion = ref(false) // Стан генерації нового питання
let quizObserver = null

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
    return `https://www.youtube.com/embed/${shortMatch[1]}?loop=1&playlist=${shortMatch[1]}`
  }
  
  // Звичайне YouTube посилання
  const regularMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/v\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  if (regularMatch) {
    return `https://www.youtube.com/embed/${regularMatch[1]}?loop=1&playlist=${regularMatch[1]}`
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

// Використовуємо кешовані зірки з градієнтами (дуже швидко)
const starPattern = computed(() => getCachedStars())

// Тільки невелика кількість анімованих зірок (10 замість 100)
const animatedStars = ref(getCachedAnimatedStars().slice(0, 10))

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

const hasImage = computed(() => {
  return props.planetData.image && props.planetData.image !== '/images/...'
})

const hasMedia = computed(() => {
  // Медіа секція завжди показується, навіть якщо немає фото (буде плейсхолдер)
  return true
})

function closeCard() {
  emit('close')
}

function handleEscape(event) {
  if (event.key === 'Escape' && props.isVisible) {
    closeCard()
  }
}

function playSound() {
  if (props.planetData.sound && props.planetData.sound !== '/sounds/...') {
    const audio = new Audio(props.planetData.sound)
    audio.play().catch(error => console.error('Помилка відтворення звуку:', error))
  }
}

// Quiz state
const isQuizLoading = computed(() => {
  // Завантаження, якщо quiz ще не завантажений (undefined або порожній масив) або генерується нове питання
  return isGeneratingNewQuestion.value || !props.planetData.quiz || props.planetData.quiz.length === 0
})

const shouldShowQuizSection = computed(() => {
  // Показуємо секцію, якщо завантажується або вже завантажено
  return isQuizLoading.value || (props.planetData.quiz && props.planetData.quiz.length > 0)
})

// Watch для виклику діалогу Стели, коли питання завантажується
let quizIntroShown = false
watch(() => props.planetData.quiz, (newQuiz) => {
  if (newQuiz && newQuiz.length > 0 && !isQuizLoading.value && !quizIntroShown && stella?.value) {
    quizIntroShown = true
    // Викликаємо діалог про вікторину з невеликою затримкою
    setTimeout(() => {
      stella.value.speak('quizIntro')
    }, 1000)
  }
}, { immediate: true })

const currentQuestion = computed(() => {
  if (props.planetData.quiz && props.planetData.quiz.length > 0) {
    const question = getRandomQuestionFromQuiz(props.planetData.quiz)
    return question
  }
  return null
})

const selectedAnswer = ref(null)
const isAnswered = ref(false)
const isCorrect = ref(false)
const attemptsLeft = ref(2) // Дві спроби
const timeRemaining = ref(30) // 30 секунд на відповідь
let timerInterval = null
let timerAnimationFrame = null

// Обробник hover для варіантів відповідей (з захистом від дригання)
let lastHoverTime = 0
let hoveredButtonId = null
function handleOptionHover(event) {
  // Використовуємо currentTarget, щоб отримати саме кнопку, а не дочірній елемент
  const button = event.currentTarget
  if (!button || !button.classList.contains('quiz-option')) {
    return
  }
  
  // Отримуємо key з data-атрибута
  const buttonKey = button.getAttribute('data-key')
  if (!buttonKey) {
    return
  }
  
  // Перевіряємо, чи це той самий елемент
  if (hoveredButtonId === buttonKey) {
    return // Вже оброблено для цього елемента
  }
  
  // Додаємо debounce, щоб звук не викликався занадто часто
  const now = Date.now()
  if (now - lastHoverTime > 300) {
    hoveredButtonId = buttonKey
    playHover()
    lastHoverTime = now
  }
}

// Прапорець для запобігання подвійних кліків
let isProcessingClick = false

// Обробник кліку на варіант відповіді
function handleAnswerClick(answerKey, event) {
  // Запобігаємо подвійним клікам
  if (isProcessingClick) {
    return
  }
  
  // Перевіряємо, чи кнопка вже відключена
  if (isAnswered.value && (attemptsLeft.value === 0 || isCorrect.value)) {
    return
  }
  
  // Встановлюємо прапорець обробки
  isProcessingClick = true
  
  // Запобігаємо поширенню події на overlay
  if (event) {
    event.stopPropagation()
    event.stopImmediatePropagation()
  }
  
  // Викликаємо selectAnswer одразу (синхронно)
  selectAnswer(answerKey)
  
  // Відтворюємо звук після обробки (не блокує)
  playClick().catch(() => {})
  
  // Скидаємо прапорець після невеликої затримки, щоб уникнути подвійних кліків
  setTimeout(() => {
    isProcessingClick = false
  }, 300)
}

function selectAnswer(answerKey) {
  // Швидкі перевірки
  if (!currentQuestion.value) {
    return
  }
  if (isAnswered.value && attemptsLeft.value === 0) {
    return
  }
  if (isAnswered.value && isCorrect.value) {
    return
  }
  
  // Встановлюємо вибрану відповідь
  selectedAnswer.value = answerKey
  isAnswered.value = true
  
  // Перевіряємо правильність відповіді
  const correct = validateQuizResponse(currentQuestion.value, answerKey)
  isCorrect.value = correct
  
  if (correct) {
    // Правильна відповідь
    stopTimer()
    
    // Визначаємо, яка це спроба (2 - attemptsLeft = спроба номер)
    const attemptNumber = 2 - attemptsLeft.value
    
    if (attemptNumber === 1) {
      // Правильна відповідь з першої спроби
      if (stella?.value) {
        setTimeout(() => {
          stella.value.speak('correctFirst')
          setTimeout(() => {
            stella.value.speak('correctFirstContinue')
          }, 4000)
        }, 500)
      }
    } else {
      // Правильна відповідь з другої спроби
      if (stella?.value) {
        setTimeout(() => {
          stella.value.speak('correctSecond')
        }, 500)
      }
    }
    
    if (props.planetId) {
      updateUserProgress(props.planetId)
      if (checkUserForBadge()) {
        setTimeout(() => {
          emit('badge-earned')
        }, 500)
      }
    }
  } else {
    // Неправильна відповідь
    attemptsLeft.value--
    
    if (attemptsLeft.value === 0) {
      // Спроби закінчилися
      stopTimer()
      
      // Неправильна відповідь з другої спроби
      if (stella?.value) {
        setTimeout(() => {
          stella.value.speak('incorrectSecond')
          setTimeout(() => {
            stella.value.speak('incorrectSecondContinue')
          }, 4000)
        }, 500)
      }
    } else {
      // Є ще спроби - зупиняємо таймер під час очікування
      stopTimer()
      
      // Неправильна відповідь з першої спроби
      if (stella?.value) {
        setTimeout(() => {
          stella.value.speak('incorrect')
        }, 500)
      }
      
      // Після 2 секунд скидаємо стан і перезапускаємо таймер
      setTimeout(() => {
        isAnswered.value = false
        selectedAnswer.value = null
        
        // Перезапускаємо таймер тільки якщо секція видима
        if (isQuizSectionVisible.value && props.isVisible) {
          startTimer()
        }
      }, 2000)
    }
  }
}

// Таймер
function startTimer() {
  // Не запускаємо таймер, якщо секція тесту не видима
  if (!isQuizSectionVisible.value) {
    return
  }
  
  stopTimer() // Зупиняємо попередній таймер, якщо є
  timeRemaining.value = 30
  
  timerInterval = setInterval(() => {
    // Зупиняємо таймер тільки якщо картка закрита або секція не видима
    if (!props.isVisible || !isQuizSectionVisible.value) {
      stopTimer()
      return
    }
    
    // Зупиняємо таймер якщо відповідь правильна
    if (isAnswered.value && isCorrect.value) {
      stopTimer()
      return
    }
    
    // Зупиняємо таймер якщо спроби закінчилися і відповідь неправильна
    if (isAnswered.value && attemptsLeft.value === 0 && !isCorrect.value) {
      stopTimer()
      return
    }
    
    // Зупиняємо таймер якщо є неправильна відповідь і ще є спроби (під час очікування)
    if (isAnswered.value && !isCorrect.value && attemptsLeft.value > 0) {
      // Таймер вже зупинений в selectAnswer, але перевіряємо тут для безпеки
      return
    }
    
    // Зменшуємо час (тільки якщо немає активної відповіді)
    if (!isAnswered.value) {
      const newTime = Math.max(0, timeRemaining.value - 1)
      timeRemaining.value = newTime
      
      if (newTime <= 0) {
        // Час вийшов - скидаємо відповіді з анімацією
        if (!isAnswered.value) {
          resetQuizWithAnimation()
        }
        stopTimer()
      }
    }
  }, 1000) // Оновлюємо кожну секунду для меншої навантаження
}

function stopTimer() {
  if (timerAnimationFrame) {
    cancelAnimationFrame(timerAnimationFrame)
    timerAnimationFrame = null
  }
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// Скидаємо стан вікторини при зміні планети або відкритті картки
function resetQuizState() {
  selectedAnswer.value = null
  isAnswered.value = false
  isCorrect.value = false
  attemptsLeft.value = 2
  timeRemaining.value = 30
  stopTimer()
  quizIntroShown = false // Скидаємо прапорець для нового питання
  isProcessingClick = false // Скидаємо прапорець обробки кліків
}

// Генерація нового питання через API
async function generateNewQuestion() {
  if (!props.planetId) {
    console.warn('No planet ID available for question generation')
    return null
  }
  
  const planetData = galaxyConfig[props.planetId]
  if (!planetData) {
    console.warn('Planet data not found for ID:', props.planetId)
    return null
  }
  
  isGeneratingNewQuestion.value = true
  
  try {
    const response = await fetch('http://127.0.0.1:5000/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: planetData.description,
        facts: planetData.facts,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(`Failed to generate question: ${errorData.error || response.statusText}`)
    }

    const question = await response.json()
    
    // Перевіряємо, чи є помилка в відповіді
    if (question.error) {
      throw new Error(question.error)
    }
    
    // Оновлюємо дані планети з новим питанням через emit
    const updatedData = { ...props.planetData, quiz: [question] }
    emit('update-planet-data', updatedData)
    
    // Чекаємо, поки Vue оновить дані
    await nextTick()
    
    return question
  } catch (error) {
    console.warn('Failed to generate new question:', error.message)
    return null
  } finally {
    isGeneratingNewQuestion.value = false
  }
}

// Обробник кнопки перезавантаження
async function handleResetQuiz() {
  playClick()
  await resetQuiz()
}

// Перезавантаження тесту з анімацією та генерацією нового питання
async function resetQuiz() {
  // Зупиняємо таймер
  stopTimer()
  
  // Плавна анімація зникнення
  if (quizContentRef.value) {
    quizContentRef.value.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
    quizContentRef.value.style.opacity = '0'
    quizContentRef.value.style.transform = 'translateY(-10px)'
  }
  
  // Скидаємо весь стан перед генерацією нового питання
  selectedAnswer.value = null
  isAnswered.value = false
  isCorrect.value = false
  attemptsLeft.value = 2
  timeRemaining.value = 30
  
  // Чекаємо трохи перед початком генерації
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Генеруємо нове питання (екран завантаження показується автоматично через isGeneratingNewQuestion)
  const newQuestion = await generateNewQuestion()
  
  if (!newQuestion) {
    console.warn('Failed to generate new question, keeping current question')
    // Якщо не вдалося згенерувати, повертаємо видимість старого питання
    if (quizContentRef.value && currentQuestion.value) {
      quizContentRef.value.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      quizContentRef.value.style.opacity = '1'
      quizContentRef.value.style.transform = 'translateY(0)'
    }
    return
  }
  
  // Чекаємо, поки Vue оновить дані
  await nextTick()
  
  // Перевіряємо, чи питання існує
  if (!currentQuestion.value) {
    console.warn('Question not available after reset')
    return
  }
  
  // Гарантуємо, що стан повністю скинуто
  selectedAnswer.value = null
  isAnswered.value = false
  isCorrect.value = false
  attemptsLeft.value = 2
  timeRemaining.value = 30
  
  // Плавна анімація появи нового питання
  await nextTick()
  if (quizContentRef.value) {
    // Спочатку встановлюємо стилі для анімації (невидимий стан)
    quizContentRef.value.style.opacity = '0'
    quizContentRef.value.style.transform = 'translateY(-10px)'
    
    // Потім через невелику затримку запускаємо анімацію появи
    setTimeout(() => {
      if (quizContentRef.value && currentQuestion.value) {
        quizContentRef.value.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
        quizContentRef.value.style.opacity = '1'
        quizContentRef.value.style.transform = 'translateY(0)'
      }
    }, 50)
  }
  
  // Запускаємо таймер знову
  if (currentQuestion.value && props.isVisible) {
    setTimeout(() => {
      startTimer()
    }, 100)
  }
}

// Скидання з анімацією при закінченні часу
function resetQuizWithAnimation() {
  // Плавна анімація зникнення
  const quizContent = document.querySelector('.quiz-content')
  if (quizContent) {
    quizContent.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
    quizContent.style.opacity = '0'
    quizContent.style.transform = 'translateY(-10px)'
  }
  
  setTimeout(async () => {
    resetQuizState()
    startTimer() // Запускаємо таймер знову
    // Плавна анімація появи
    await nextTick()
    if (quizContent) {
      setTimeout(() => {
        quizContent.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
        quizContent.style.opacity = '1'
        quizContent.style.transform = 'translateY(0)'
      }, 50)
    }
  }, 500)
}

watch(() => props.planetId, () => {
  resetQuizState()
})

// Налаштування Intersection Observer для відстеження видимості секції тесту
function setupQuizObserver() {
  if (!quizSectionRef.value) {
    return
  }
  
  // Зупиняємо попередній observer, якщо є
  if (quizObserver) {
    quizObserver.disconnect()
    quizObserver = null
  }
  
  // Знаходимо контейнер картки для root
  const cardContainer = quizSectionRef.value.closest('.planet-card-content-wrapper')
  
  quizObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const wasVisible = isQuizSectionVisible.value
        isQuizSectionVisible.value = entry.isIntersecting
        
        // Якщо секція стала видимою і є питання, запускаємо таймер
        if (entry.isIntersecting && currentQuestion.value && props.isVisible && !isAnswered.value) {
          startTimer()
        } else if (!entry.isIntersecting && wasVisible) {
          stopTimer()
        }
      })
    },
    {
      threshold: 0.1, // Секція вважається видимою, коли 10% її видно
      rootMargin: '0px',
      root: cardContainer || null // Використовуємо контейнер картки як root
    }
  )
  
  quizObserver.observe(quizSectionRef.value)
}

// Додаємо обробник для клавіші ESC
watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    document.addEventListener('keydown', handleEscape)
    // Скидаємо стан вікторини при відкритті картки
    resetQuizState()
    isQuizSectionVisible.value = false // Спочатку секція не видима
    // Налаштовуємо observer для секції тесту з затримкою, щоб DOM встиг оновитися
    nextTick(() => {
      setTimeout(() => {
        if (currentQuestion.value) {
          if (quizSectionRef.value) {
            setupQuizObserver()
          } else {
            console.warn('Quiz section ref not found, retrying...')
            // Повторна спроба через невелику затримку
            setTimeout(() => {
              if (quizSectionRef.value) {
                setupQuizObserver()
              }
            }, 200)
          }
        }
      }, 100)
    })
    // Не відтворюємо відео автоматично - користувач сам запустить через controls
  } else {
    document.removeEventListener('keydown', handleEscape)
    stopTimer() // Зупиняємо таймер при закритті
    // Зупиняємо observer
    if (quizObserver) {
      quizObserver.disconnect()
      quizObserver = null
    }
    isQuizSectionVisible.value = false
    // Зупиняємо відео при закритті картки (тільки для звичайних video, не YouTube)
    if (planetVideo.value && !isYouTubeVideo.value) {
      planetVideo.value.pause()
    }
  }
})

// Запускаємо observer при зміні питання
watch(() => currentQuestion.value, (newQuestion) => {
  if (newQuestion && props.isVisible) {
    resetQuizState()
    isQuizSectionVisible.value = false // Скидаємо видимість при зміні питання
    nextTick(() => {
      setTimeout(() => {
        if (quizSectionRef.value) {
          setupQuizObserver()
        }
      }, 100)
    })
  }
})

// Відстежуємо видимість секції тесту і запускаємо таймер
watch(() => isQuizSectionVisible.value, (isVisible) => {
  if (isVisible && currentQuestion.value && props.isVisible && !isAnswered.value) {
    startTimer()
  } else if (!isVisible) {
    stopTimer()
  }
})

// Не відтворюємо відео автоматично при зміні planetData
// Користувач сам запустить через controls

onMounted(() => {
  if (props.isVisible) {
    document.addEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  stopTimer() // Зупиняємо таймер при видаленні компонента
  // Зупиняємо observer
  if (quizObserver) {
    quizObserver.disconnect()
    quizObserver = null
  }
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
  background: rgba(0, 0, 0, 0.85);
  /* Видалено backdrop-filter для кращої продуктивності */
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

/* Статичні зірки через CSS градієнти (дуже швидко, без DOM елементів) */
.stars-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  opacity: 0.7;
  will-change: opacity;
  pointer-events: none;
  border-radius: 30px;
}

/* Анімовані зірки (тільки невелика кількість для ефекту) */
.animated-star {
  position: absolute;
  background: white;
  border-radius: 50%;
  box-shadow: 
    0 0 2px rgba(255, 255, 255, 0.9),
    0 0 4px rgba(255, 255, 255, 0.7),
    0 0 6px rgba(150, 180, 255, 0.5),
    0 0 8px rgba(100, 150, 255, 0.3);
  animation: twinkleStar infinite ease-in-out;
  opacity: 0.6;
  transform-origin: center;
  will-change: transform, opacity;
}

/* Різні відтінки для анімованих зірок */
.animated-star:nth-child(3n) {
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
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.8;
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
  /* Видалено backdrop-filter для кращої продуктивності */
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

.media-photo-container {
  width: 100%;
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-photo {
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: contain; /* Змінив з cover на contain, щоб зображення не обрізалося */
  transition: transform 0.3s ease;
}

.media-photo:hover {
  transform: scale(1.02);
}

.media-photo-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 10px;
  opacity: 0.6;
}

.placeholder-text {
  font-family: 'Nunito', sans-serif;
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.6;
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

.sound-button:hover {
  border-color: #4ecdc4;
  box-shadow: 0 5px 20px rgba(78, 205, 196, 0.4);
}


.quiz-content {
  font-family: 'Nunito', sans-serif;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.quiz-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 300px;
  font-family: 'Nunito', sans-serif;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.quiz-question {
  font-family: 'Nunito', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  /* Запобігаємо дриганню через isolation */
  isolation: isolate;
}

.quiz-option {
  font-family: 'Nunito', sans-serif;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  outline: none;
  /* Фіксуємо розмір */
  min-height: 54px;
  /* Використовуємо outline замість зміни border для hover */
  outline: 2px solid transparent;
  outline-offset: -2px;
  /* Запобігаємо дриганню */
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  /* Оптимізація рендерингу */
  transform: translateZ(0);
  /* Забезпечуємо, що кнопка може отримувати кліки */
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Використовуємо outline для hover, щоб не змінювати border */
.quiz-option:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  outline-color: rgba(255, 215, 0, 0.5);
  /* Гарантуємо, що нічого не змінюється */
  transform: none !important;
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.quiz-option:active:not(.disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.quiz-option:focus:not(.disabled) {
  outline-color: rgba(255, 215, 0, 0.5);
}

.quiz-option.selected:not(.disabled) {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  /* Запобігаємо дриганню при додаванні класу */
  transform: none !important;
  box-shadow: none !important;
}

.quiz-option.correct {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.quiz-option.incorrect {
  border-color: #f87171;
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

.quiz-option.disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.option-label {
  font-weight: 700;
  min-width: 24px;
  pointer-events: none;
  user-select: none;
}

.option-text {
  flex: 1;
  pointer-events: none;
  user-select: none;
}

.quiz-result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 12px;
  text-align: center;
}

.result-message {
  font-family: 'Nunito', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  padding: 0;
}

.correct-message {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.incorrect-message {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

.quiz-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  gap: 15px;
}

.quiz-attempts-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attempts-text {
  font-family: 'Nunito', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.quiz-reset-button {
  font-family: 'Nunito', sans-serif;
  padding: 12px 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.quiz-reset-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
}

.quiz-reset-button span {
  font-size: 1.2rem;
  animation: rotate 2s linear infinite;
}

.quiz-timer {
  position: relative;
  margin-top: 20px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #4ade80 0%, #22c55e 50%, #fbbf24 80%, #f87171 100%);
  border-radius: 14px;
  transition: width 0.1s linear;
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.4);
  animation: pulse-timer 2s ease-in-out infinite;
}

.timer-text {
  position: relative;
  font-family: 'Nunito', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  text-shadow: 
    0 0 10px rgba(0, 0, 0, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 2;
  padding: 0 12px;
  letter-spacing: 0.5px;
}

@keyframes pulse-timer {
  0%, 100% {
    box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(74, 222, 128, 0.8);
  }
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

  .quiz-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .quiz-reset-button {
    width: 100%;
    justify-content: center;
  }

  .quiz-timer {
    margin-top: 15px;
  }
}
</style>
