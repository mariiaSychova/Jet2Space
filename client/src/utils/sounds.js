// Імпортуємо звукові файли (Vite автоматично поверне URL)
import backgroundSound from '../assets/sounds/background.mp3'
import clickSound from '../assets/sounds/click.mp3'
import hoverSound from '../assets/sounds/hover.mp3'
import rocketSound from '../assets/sounds/rocket.mp3'

let audioCtx;
let backgroundBuffer;
let clickBuffer;
let hoverBuffer;
let rocketBuffer;
let source;
let gainNode;
let isPlaying = false; 

// Звуки ракети
let rocketSource = null;
let rocketGainNode = null;
let isRocketPlaying = false;

async function loadAudio(url) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to load audio:', url, response.statusText);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Error loading audio:', url, error);
    return null;
  }
}

export async function playBackground() {
  try {
    // Якщо музика вже грає, не робимо нічого
    if (isPlaying) {
      return;
    }

    // Зупиняємо попереднє відтворення, якщо воно є (на випадок, якщо source залишився)
    if (source) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ігноруємо помилки при зупинці (можливо, source вже зупинений)
      }
      source = null;
    }
    
    // Також очищаємо gainNode, якщо він залишився
    if (gainNode) {
      try {
        gainNode.disconnect();
      } catch (e) {
        // Ігноруємо помилки
      }
      gainNode = null;
    }

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Намагаємося активувати AudioContext, якщо він заблокований
    if (audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (resumeError) {
        console.warn('AudioContext resume failed, user interaction may be required:', resumeError);
        // Продовжуємо спробу відтворення навіть якщо resume не спрацював
      }
    }

    if (!backgroundBuffer) {
      backgroundBuffer = await loadAudio(backgroundSound);
      if (!backgroundBuffer) {
        console.error('Failed to load background music');
        isPlaying = false;
        return;
      }
    }

    source = audioCtx.createBufferSource();
    source.buffer = backgroundBuffer;
    source.loop = true;

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.3;

    source.connect(gainNode).connect(audioCtx.destination);
    
    // Спробуємо запустити відтворення
    try {
      source.start(0);
      isPlaying = true;

      source.onended = () => {
        isPlaying = false;
        source = null;
      };
    } catch (startError) {
      console.warn('Audio playback start failed, may require user interaction:', startError);
      // Якщо не вдалося запустити, спробуємо пізніше через user interaction
      isPlaying = false;
      source = null;
      throw startError;
    }
  } catch (error) {
    console.error('Error playing background music:', error);
    isPlaying = false;
    source = null;
    throw error;
  }
}

export function stopBackground() {
  // Встановлюємо isPlaying в false перед зупинкою, щоб уникнути гонок
  isPlaying = false;
  
  if (source) {
    try {
      // Видаляємо обробник onended перед зупинкою
      source.onended = null;
      source.stop();
      source.disconnect();
    } catch (e) {
      // Ігноруємо помилки при зупинці (можливо, source вже зупинений)
      console.warn('Error stopping background music:', e);
    }
    source = null;
  }
  if (gainNode) {
    try {
      gainNode.disconnect();
    } catch (e) {
      // Ігноруємо помилки
    }
    gainNode = null;
  }
}

export function getBackgroundState() {
  return isPlaying;
}

export async function playClick() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    if (!clickBuffer) {
      clickBuffer = await loadAudio(clickSound);
      if (!clickBuffer) return;
    }

    const clickSource = audioCtx.createBufferSource();
    clickSource.buffer = clickBuffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.6;
    clickSource.connect(gainNode).connect(audioCtx.destination);
    clickSource.start(0);
  } catch (error) {
    console.error('Error playing click sound:', error);
  }
}

export async function playHover() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    if (!hoverBuffer) {
      hoverBuffer = await loadAudio(hoverSound);
      if (!hoverBuffer) return;
    }

    const hoverSource = audioCtx.createBufferSource();
    hoverSource.buffer = hoverBuffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.25;
    hoverSource.connect(gainNode).connect(audioCtx.destination);
    hoverSource.start(0);
  } catch (error) {
    console.error('Error playing hover sound:', error);
  }
}

// ==================== ЗВУКИ РАКЕТИ ====================

export async function playRocketEngine() {
  try {
    // Якщо звук вже грає, не запускаємо повторно
    if (isRocketPlaying) {
      console.log('Rocket engine already playing');
      return;
    }

    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    
    // Завантажуємо звук ракети, якщо ще не завантажено
    if (!rocketBuffer) {
      rocketBuffer = await loadAudio(rocketSound);
      if (!rocketBuffer) {
        console.error('Failed to load rocket sound');
        return;
      }
    }

    // Зупиняємо попереднє відтворення (на всяк випадок)
    stopRocketEngine();

    // Створюємо новий source для відтворення
    rocketSource = audioCtx.createBufferSource();
    rocketSource.buffer = rocketBuffer;
    rocketSource.loop = true; // Зациклюємо звук двигуна

    // Створюємо gainNode для контролю гучності
    rocketGainNode = audioCtx.createGain();
    rocketGainNode.gain.value = 0.4; // Початкова гучність 40%

    // Підключаємо source -> gain -> destination
    rocketSource.connect(rocketGainNode).connect(audioCtx.destination);
    
    // Запускаємо відтворення
    rocketSource.start(0);
    isRocketPlaying = true;

    // Обробник завершення (на випадок, якщо звук не зациклений)
    rocketSource.onended = () => {
      isRocketPlaying = false;
      rocketSource = null;
    };

    console.log('Rocket engine sound started');
  } catch (error) {
    console.error('Error playing rocket engine sound:', error);
    isRocketPlaying = false;
    rocketSource = null;
  }
}

export function stopRocketEngine() {
  isRocketPlaying = false;
  
  if (rocketSource) {
    try {
      rocketSource.onended = null;
      rocketSource.stop();
      rocketSource.disconnect();
    } catch (e) {
      console.warn('Error stopping rocket engine:', e);
    }
    rocketSource = null;
  }
  
  if (rocketGainNode) {
    try {
      rocketGainNode.disconnect();
    } catch (e) {
      // Ігноруємо помилки
    }
    rocketGainNode = null;
  }

  console.log('Rocket engine sound stopped');
}

// Функція для плавної зміни гучності двигуна (fade)
export function fadeRocketEngine(targetVolume, duration = 1000) {
  if (rocketGainNode && isRocketPlaying) {
    try {
      const currentTime = audioCtx.currentTime;
      // Плавно змінюємо гучність до цільового значення
      rocketGainNode.gain.linearRampToValueAtTime(
        targetVolume * 0.4, // Множимо на базову гучність (0.4)
        currentTime + duration / 1000
      );
      console.log(`Fading rocket engine to ${targetVolume * 100}% over ${duration}ms`);
    } catch (e) {
      console.warn('Error fading rocket engine:', e);
    }
  }
}

// Функція для перевірки, чи грає звук ракети
export function isRocketEngineePlaying() {
  return isRocketPlaying;
}