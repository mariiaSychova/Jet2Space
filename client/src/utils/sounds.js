// Імпортуємо звукові файли (Vite автоматично поверне URL)
import backgroundSound from '../assets/sounds/background.mp3'
import clickSound from '../assets/sounds/click.mp3'
import hoverSound from '../assets/sounds/hover.mp3'

let audioCtx;
let backgroundBuffer;
let clickBuffer;
let hoverBuffer;
let source;
let gainNode;
let isPlaying = false; 

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
