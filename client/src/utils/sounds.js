let audioCtx;
let backgroundBuffer;
let source;
let isPlaying = false; 

async function loadAudio(url) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

export async function playBackground() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  if (isPlaying) return;

  if (!backgroundBuffer) {
    backgroundBuffer = await loadAudio('/src/assets/sounds/background.mp3');
  }

  source = audioCtx.createBufferSource();
  source.buffer = backgroundBuffer;
  source.loop = true;

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.3;

  source.connect(gainNode).connect(audioCtx.destination);
  source.start(0);

  isPlaying = true;

  source.onended = () => {
    isPlaying = false;
  };
}

export function stopBackground() {
  if (source) {
    source.stop();
    source.disconnect();
    source = null;
    isPlaying = false;
  }
}

export async function playClick() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  const response = await fetch('/src/assets/sounds/click.mp3');
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await audioCtx.decodeAudioData(arrayBuffer);

  const clickSource = audioCtx.createBufferSource();
  clickSource.buffer = buffer;
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.6;
  clickSource.connect(gainNode).connect(audioCtx.destination);
  clickSource.start(0);
}

export async function playHover() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  const response = await fetch('/src/assets/sounds/hover.mp3');
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await audioCtx.decodeAudioData(arrayBuffer);

  const hoverSource = audioCtx.createBufferSource();
  hoverSource.buffer = buffer;
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.25;
  hoverSource.connect(gainNode).connect(audioCtx.destination);
  hoverSource.start(0);
}
