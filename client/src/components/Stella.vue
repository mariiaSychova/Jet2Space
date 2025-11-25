<template>
  <div>
    <!-- Затемнення фону (overlay) -->
    <transition name="overlay-fade">
      <div v-if="isSpotlightMode" class="spotlight-overlay" @click="skipIntro"></div>
    </transition>

    <!-- Контейнер Стелли -->
    <div 
      class="stella-container" 
      :class="{ 
        'spotlight-mode': isSpotlightMode,
        'compact-mode': !isSpotlightMode 
      }"
    >

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
          decoding="sync"
          width="200"
          height="200"
        />
        
        <!-- Ефект світіння при розмові -->
        <div v-if="isSpeaking || showGlow" class="glow-effect"></div>
      </div>
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
      currentDialogueKey: null,
      displayedMessage: '',
      isSpeaking: false,
      mouthOpen: false,
      showBubble: false,
      showGlow: false,
      typingInterval: null,
      mouthInterval: null,
      isSpotlightMode: false,
      isFullyFinished: true,
      messageQueue: [],
      
      // Діалоги, що показуються в spotlight режимі
      spotlightDialogues: ['welcome', 'quizIntro', 'correctFirst', 'correctFirstContinue', 'correctSecond', 'incorrectSecondContinue', 'continueJourney', 'completion'],
      
      dialogues: {
        welcome: 'Вітаю з початком твоєї космічної експедиції, досліднику! Я – Стелла, твій гід. Разом ми дослідімо Сонячну систему. Обери свій перший космічний об\'єкт і розпочнемо подорож!',
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

      if (!this.isFullyFinished) {
        this.messageQueue.push({ dialogueKey, customMessage })
        return
      }
      
      this.currentDialogueKey = dialogueKey
      
      this.clearIntervals()
      this.stopMouthAnimation()
      
      const needsSpotlight = this.spotlightDialogues.includes(dialogueKey)
      
      if (needsSpotlight) {
        this.isSpotlightMode = true
      }
      
      this.isFullyFinished = false
      this.currentMessage = message
      this.displayedMessage = ''
      this.showBubble = true
      this.isSpeaking = true
      this.showGlow = true
      
      this.startMouthAnimation()
      this.typeMessage(message, dialogueKey)
    },
    
    typeMessage(message, dialogueKey) {
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
              
              if (this.spotlightDialogues.includes(dialogueKey)) {
                setTimeout(() => {
                  this.exitSpotlightMode()
                  this.isFullyFinished = true
                  this.processQueue()
                }, 800)
              } else {
                this.isFullyFinished = true
                this.processQueue()
              }
            }, 2000)
          }, 2000)
        }
      }, typingSpeed)
    },
    
    exitSpotlightMode() {
      this.isSpotlightMode = false
    },
    
    processQueue() {
      if (this.messageQueue.length > 0) {
        const next = this.messageQueue.shift()
        setTimeout(() => {
          this.speak(next.dialogueKey, next.customMessage)
        }, 300)
      }
    },
    
    skipIntro() {
      if (this.isSpotlightMode && this.isSpeaking) {
        this.clearIntervals()
        this.stopMouthAnimation()
        this.displayedMessage = this.currentMessage
        setTimeout(() => {
          this.showBubble = false
          setTimeout(() => {
            this.exitSpotlightMode()
            this.isFullyFinished = true
            this.processQueue()
          }, 500)
        }, 1000)
      }
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
      // Світіння залишається після завершення мови
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
      this.isSpeaking = false
    },
    
    repeatMessage() {
      if (this.currentMessage && !this.isSpeaking && this.currentDialogueKey) {
        this.speak(this.currentDialogueKey)
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
    // Images are already preloaded in main.js, but ensure they're in cache
    // by creating Image objects to warm the cache
    const warmCache = (src) => {
      const img = new Image()
      img.src = src
    }
    
    warmCache(stellaClosed)
    warmCache(stellaOpen)
  },
  beforeUnmount() {
    this.clearIntervals()
  }
}
</script>

<style scoped>
/* Затемнення фону */
.spotlight-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9998;
  cursor: pointer;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: all 0.8s ease;
}

.overlay-fade-enter-from {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.overlay-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

/* Контейнер Стелли */
.stella-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Кнопка закриття - фіксована у правому верхньому куті */
.close-button-fixed {
  position: fixed;
  top: 30px;
  right: 30px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(147, 197, 253, 0.5);
  color: #1a1a2e;
  cursor: pointer;
  pointer-events: all;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.close-button-fixed svg {
  width: 22px;
  height: 22px;
}

.close-button-fixed:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.close-button-fixed:active {
  transform: scale(0.95) rotate(90deg);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Компактний режим - внизу зліва */
.stella-container.compact-mode {
  bottom: 20px;
  left: 40px;
  top: auto;
  transform: translate(0, 0) scale(1);
  /* Ensure visibility for LCP */
  opacity: 1;
  visibility: visible;
}

/* Spotlight режим - по центру екрану */
.stella-container.spotlight-mode {
  top: 65%;
  left: 50%;
  bottom: auto;
  transform: translate(-50%, -50%) scale(2);
  max-width: 90vw;
  max-height: 85vh;
}

.stella-character {
  width: 200px;
  height: 200px;
  position: relative;
  cursor: pointer;
  pointer-events: all;
  z-index: 1;
  /* Ensure container is always visible and doesn't cause layout shifts */
  min-width: 200px;
  min-height: 200px;
  /* Remove any visible borders */
  border: none !important;
  outline: none !important;
  background: transparent !important;
  /* Prevent overflow that might create visible edges */
  overflow: visible;
  /* Remove box shadow that might look like a border */
  box-shadow: none !important;
  /* Ensure no visible frame around container */
  -webkit-appearance: none;
  appearance: none;
}

.stella-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 4px 20px rgba(100, 200, 255, 0.3));
  transition: transform 0.2s ease;
  /* Optimize rendering */
  will-change: transform;
  transform: translateZ(0);
  /* Remove any visible borders or outlines */
  border: none !important;
  outline: none !important;
  background: transparent !important;
  /* Ensure no box model issues */
  box-sizing: border-box;
  padding: 0 !important;
  margin: 0 !important;
  /* Prevent any default image styling */
  vertical-align: top;
  /* Remove any box shadow that might look like a border */
  box-shadow: none !important;
  /* Ensure no visible frame */
  -webkit-appearance: none;
  appearance: none;
}

.spotlight-mode .stella-image {
  filter: drop-shadow(0 8px 40px rgba(100, 200, 255, 0.6));
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

.spotlight-mode .glow-effect {
  background: radial-gradient(circle, rgba(147, 197, 253, 0.6) 0%, transparent 70%);
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
  box-sizing: border-box;
  z-index: 2;
}

/* В spotlight режимі бульбашка більша */
.spotlight-mode .speech-bubble {
  max-width: min(480px, 85vw);
  min-width: min(380px, 75vw);
  padding: 14px 18px;
  left: 50%;
  transform: translateX(-50%);
  bottom: 230px;
  box-sizing: border-box;
  font-size: 14px;
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

.spotlight-mode .speech-bubble::after {
  left: 50%;
  transform: translateX(-50%);
}

.message-text {
  margin: 0;
  color: #1a1a2e;
  font-size: 16px;
  line-height: 1.6;
  font-weight: 500;
  font-family: 'Nunito', sans-serif;
}

.spotlight-mode .message-text {
  font-size: 14px;
  line-height: 1.4;
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
  .stella-container.compact-mode {
    bottom: 10px;
    left: 10px;
  }
  
  .stella-character {
    width: 130px;
    height: 130px;
  }
  
  .stella-container.spotlight-mode {
    transform: translate(-50%, -50%) scale(1.5);
    max-width: 95vw;
    max-height: 80vh;
    top: 60%;
  }
  
  .close-button-fixed {
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
  }
  
  .close-button-fixed svg {
    width: 20px;
    height: 20px;
  }
  
  .speech-bubble {
    max-width: 300px;
    min-width: 220px;
    bottom: 140px;
    left: -10px;
    padding: 16px 20px;
    font-size: 14px;
    box-sizing: border-box;
  }
  
  .spotlight-mode .speech-bubble {
    max-width: min(320px, 90vw);
    min-width: min(250px, 85vw);
    font-size: 14px;
    padding: 16px 20px;
    bottom: 150px;
  }
  
  .speech-bubble::after {
    left: 30px;
  }
}
</style>