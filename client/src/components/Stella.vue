<template>
  <div class="stella-container">
    <!-- Мовна бульбашка -->
    <transition name="bubble">
      <div v-if="showBubble && displayedMessage" class="speech-bubble">
        <p class="message-text">
          {{ displayedMessage }}
          <span v-if="isSpeaking" class="cursor"></span>
        </p>
      </div>
    </transition>

    <!-- Персонаж Стелла -->
    <div class="stella-character" @click="repeatMessage">
      <img 
        :src="currentImage" 
        alt="Стелла"
        class="stella-image"
        :class="{ 'speaking': isSpeaking }"
        fetchpriority="high"
        loading="eager"
        decoding="async"
        width="200"
        height="200"
      />
      
      <!-- Ефект світіння при розмові -->
      <div v-if="isSpeaking" class="glow-effect"></div>
    </div>
  </div>
</template>

<script>
import stellaClosed from '../../src/assets/images/Stella_closed.svg'
import stellaOpen from '../../src/assets/images/Stella_open.svg'

export default {
  name: 'Stella',
  data() {
    return {
      currentMessage: '',
      displayedMessage: '',
      isSpeaking: false,
      mouthOpen: false,
      showBubble: false,
      typingInterval: null,
      mouthInterval: null,
      
      dialogues: {
        welcome: 'Вітаю з початком твоєї космічної експедиції, досліднику! Я – Стелла, твій гід. Разом ми дослідимо Сонячну систему. Обери свій перший космічний об\'єкт і розпочнемо подорож!',
        traveling: 'Тримайся міцніше! Ми летимо!',
        quizIntro: 'Перевіримо твої знання! Спробуй відповісти на запитання.',
        correctFirst: 'Відмінно! Твої знання сяють яскравіше за зорі!',
        correctFirstContinue: 'Вітаю із проходженням тесту! Летімо далі!',
        incorrect: 'Не зовсім так! Спробуй ще раз!',
        correctSecond: 'Вітаю із проходженням тесту! Твої знання розширюються, мов галактика. Летімо далі!',
        incorrectSecond: 'Не хвилюйся, кожна помилка - це теж крок уперед!',
        incorrectSecondContinue: 'Вітаю із проходженням тесту! Летімо далі!',
        continueJourney: 'Обирай наступне місце призначення й продовжуй експедицію. Кожне відкриття робить тебе ближчим до звання астронавта!',
        completion: 'Вітаю, досліднику! Ти успішно завершив експедицію Сонячною системою. За твою наполегливість ти отримуєш почесний бейджик астронавта! Було приємно супроводжувати тебе. До нових пригод!'
      }
    }
  },
  computed: {
    currentImage() {
      return this.mouthOpen ? stellaOpen : stellaClosed
    }
  },
  methods: {
    speak(dialogueKey, customMessage = null) {
      const message = customMessage || this.dialogues[dialogueKey]
      if (!message) {
        console.warn('Діалог не знайдено:', dialogueKey)
        return
      }
      
      this.clearIntervals()
      this.currentMessage = message
      this.displayedMessage = ''
      this.showBubble = true
      this.isSpeaking = true
      
      this.startMouthAnimation()
      this.typeMessage(message)
    },
    
    typeMessage(message) {
      let index = 0
      const typingSpeed = 50
      
      this.typingInterval = setInterval(() => {
        if (index < message.length) {
          this.displayedMessage = message.substring(0, index + 1)
          index++
        } else {
          clearInterval(this.typingInterval)
          setTimeout(() => {
            this.stopMouthAnimation()
            setTimeout(() => {
              this.showBubble = false
            }, 2000)
          }, 2000)
        }
      }, typingSpeed)
    },
    
    startMouthAnimation() {
      this.mouthInterval = setInterval(() => {
        this.mouthOpen = !this.mouthOpen
      }, 200)
    },
    
    stopMouthAnimation() {
      if (this.mouthInterval) {
        clearInterval(this.mouthInterval)
        this.mouthInterval = null
      }
      this.mouthOpen = false
      this.isSpeaking = false
    },
    
    clearIntervals() {
      if (this.typingInterval) {
        clearInterval(this.typingInterval)
        this.typingInterval = null
      }
      if (this.mouthInterval) {
        clearInterval(this.mouthInterval)
        this.mouthInterval = null
      }
    },
    
    repeatMessage() {
      if (this.currentMessage && !this.isSpeaking) {
        this.speak(null, this.currentMessage)
      }
    },
    
    hide() {
      this.showBubble = false
      this.clearIntervals()
      this.stopMouthAnimation()
    },
    speakWithAnswer(dialogueKey, correctAnswer) {
      const messages = {
        incorrectSecond: `Правильна відповідь - ${correctAnswer}. Не хвилюйся, кожна помилка - це теж крок уперед!`
      }
      this.speak(dialogueKey, messages[dialogueKey])
    }
  },
  mounted() {
    // Preload both images immediately when component mounts
    const preloadImage = (src) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      link.fetchPriority = 'high'
      document.head.appendChild(link)
      
      // Also create Image object to force browser to fetch
      const img = new Image()
      img.src = src
    }
    
    // Preload both images
    preloadImage(stellaClosed)
    preloadImage(stellaOpen)
  },
  beforeUnmount() {
    this.clearIntervals()
  }
}
</script>

<style scoped>
.stella-container {
  position: fixed;
  bottom: 20px;
  left: 40px;
  z-index: 1000;
  pointer-events: none;
}

.stella-character {
  width: 200px;
  height: 200px;
  position: relative;
  cursor: pointer;
  pointer-events: all;
}

.stella-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 20px rgba(100, 200, 255, 0.3));
  transition: transform 0.2s ease;
}

.stella-image:hover {
  transform: scale(1.05);
}

.stella-image.speaking {
  animation: bounce 0.6s ease-in-out infinite;
}

.glow-effect {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.4) 0%, transparent 70%);
  animation: pulse 2s ease-in-out infinite;
  pointer-events: none;
}

.speech-bubble {
  position: absolute;
  bottom: 220px;
  left: 0;
  max-width: 400px;
  min-width: 280px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(147, 197, 253, 0.3);
  pointer-events: all;
}

.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 60px;
  width: 0;
  height: 0;
  border-left: 16px solid transparent;
  border-right: 16px solid transparent;
  border-top: 16px solid rgba(255, 255, 255, 0.98);
}

.message-text {
  margin: 0;
  color: #1a1a2e;
  font-size: 16px;
  line-height: 1.6;
  font-weight: 500;
  font-family: 'Nunito', sans-serif;
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 18px;
  background: #3b82f6;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

.bubble-enter-active {
  animation: bubbleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.bubble-leave-active {
  animation: bubbleOut 0.3s ease-in;
}

@keyframes bubbleIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bubbleOut {
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .stella-container {
    bottom: 10px;
    left: 10px;
  }
  
  .stella-character {
    width: 130px;
    height: 130px;
  }
  
  .speech-bubble {
    max-width: 300px;
    min-width: 220px;
    bottom: 140px;
    left: -10px;
    padding: 16px 20px;
    font-size: 14px;
  }
  
  .speech-bubble::after {
    left: 30px;
  }
}
</style>