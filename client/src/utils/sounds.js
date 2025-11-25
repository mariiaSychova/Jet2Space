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
// Зберігаємо всі активні джерела для надійного вимкнення
let allActiveSources = new Set(); 

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
        allActiveSources.delete(source);
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
    
    // Очищаємо всі активні джерела
    allActiveSources.forEach((activeSource) => {
      try {
        activeSource.stop();
        activeSource.disconnect();
      } catch (e) {
        // Ігноруємо помилки
      }
    });
    allActiveSources.clear();

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
    
    // Додаємо source до множини активних джерел
    allActiveSources.add(source);

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.3;

    source.connect(gainNode).connect(audioCtx.destination);
    
    // Спробуємо запустити відтворення
    try {
      source.start(0);
      isPlaying = true;

      source.onended = () => {
        isPlaying = false;
        allActiveSources.delete(source);
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
  console.log('stopBackground called, isPlaying:', isPlaying, 'source exists:', !!source, 'gainNode exists:', !!gainNode, 'audioCtx exists:', !!audioCtx, 'audioCtx state:', audioCtx?.state, 'active sources count:', allActiveSources.size);
  
  // Встановлюємо isPlaying в false перед зупинкою, щоб уникнути гонок
  isPlaying = false;
  
  // Зберігаємо посилання на локальні змінні
  const currentSource = source;
  const currentGainNode = gainNode;
  const currentAudioCtx = audioCtx;
  
  // КРИТИЧНО: Спочатку приглушуємо gainNode до 0 - це миттєво зменшує гучність
  if (currentGainNode && currentAudioCtx) {
    try {
      const currentTime = currentAudioCtx.currentTime;
      // Скасовуємо всі заплановані зміни гучності
      currentGainNode.gain.cancelScheduledValues(currentTime);
      // Миттєво встановлюємо гучність на 0
      currentGainNode.gain.setValueAtTime(0, currentTime);
      console.log('GainNode muted to 0 (immediate)');
    } catch (e) {
      try {
        // Fallback: просто встановлюємо значення
        currentGainNode.gain.value = 0;
        console.log('GainNode muted to 0 (fallback)');
      } catch (e2) {
        console.warn('Error muting gainNode:', e2);
      }
    }
  }
  
  // Потім відключаємо gainNode від destination - це миттєво зупиняє звук
  if (currentGainNode) {
    try {
      currentGainNode.disconnect();
      console.log('GainNode disconnected from destination');
    } catch (e) {
      console.warn('Error disconnecting gainNode:', e);
    }
  }
  
  // Зупиняємо ВСІ активні джерела (на випадок, якщо є кілька)
  allActiveSources.forEach((activeSource) => {
    try {
      activeSource.onended = null;
      if (currentAudioCtx) {
        activeSource.stop(currentAudioCtx.currentTime);
      } else {
        activeSource.stop();
      }
      activeSource.disconnect();
      console.log('Active source stopped and disconnected');
    } catch (e) {
      console.warn('Error stopping active source:', e);
    }
  });
  allActiveSources.clear();
  
  // Тепер зупиняємо основний source - це зупиняє генерацію звуку
  if (currentSource) {
    try {
      // Видаляємо обробник onended перед зупинкою
      currentSource.onended = null;
      // Зупиняємо source миттєво
      if (currentAudioCtx) {
        currentSource.stop(currentAudioCtx.currentTime);
      } else {
        currentSource.stop();
      }
      console.log('Source stopped immediately');
    } catch (e) {
      // Якщо stop() не працює, спробуємо без параметрів
      try {
        currentSource.stop();
        console.log('Source stopped (fallback)');
      } catch (e2) {
        console.warn('Error stopping background music source:', e2);
      }
    }
    
    // Відключаємо source від всього
    try {
      currentSource.disconnect();
      console.log('Source disconnected');
    } catch (e) {
      console.warn('Error disconnecting source:', e);
    }
    
    source = null;
  } else {
    console.warn('No source to stop');
  }
  
  // Очищаємо gainNode
  gainNode = null;
  
  console.log('stopBackground completed, isPlaying:', isPlaying, 'source cleared:', !source, 'gainNode cleared:', !gainNode, 'active sources cleared:', allActiveSources.size);
  
  // Перевіряємо, чи дійсно все зупинилося
  // ВАЖЛИВО: Не призупиняємо AudioContext, щоб інші звуки (hover, click) могли працювати
  if (currentAudioCtx) {
    console.log('AudioContext state after stop:', currentAudioCtx.state);
    // Переконаємося, що AudioContext залишається активним для інших звуків
    if (currentAudioCtx.state === 'suspended') {
      try {
        currentAudioCtx.resume().then(() => {
          console.log('AudioContext resumed after stopBackground');
        }).catch(err => {
          console.warn('Failed to resume AudioContext after stopBackground:', err);
        });
      } catch (e) {
        console.warn('Error resuming AudioContext:', e);
      }
    }
  }
}

export function getBackgroundState() {
  return isPlaying;
}

export async function playClick() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Переконаємося, що AudioContext активний
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    if (!clickBuffer) {
      clickBuffer = await loadAudio(clickSound);
      if (!clickBuffer) {
        console.warn('Click buffer not loaded');
        return;
      }
    }

    const clickSource = audioCtx.createBufferSource();
    clickSource.buffer = clickBuffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.6;
    clickSource.connect(gainNode).connect(audioCtx.destination);
    clickSource.start(0);
    console.log('Click sound played, audioCtx state:', audioCtx.state);
  } catch (error) {
    console.error('Error playing click sound:', error, 'audioCtx state:', audioCtx?.state);
  }
}

export async function playHover() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Переконаємося, що AudioContext активний
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    if (!hoverBuffer) {
      hoverBuffer = await loadAudio(hoverSound);
      if (!hoverBuffer) {
        console.warn('Hover buffer not loaded');
        return;
      }
    }

    const hoverSource = audioCtx.createBufferSource();
    hoverSource.buffer = hoverBuffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.25;
    hoverSource.connect(gainNode).connect(audioCtx.destination);
    hoverSource.start(0);
    console.log('Hover sound played, audioCtx state:', audioCtx.state);
  } catch (error) {
    console.error('Error playing hover sound:', error, 'audioCtx state:', audioCtx?.state);
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