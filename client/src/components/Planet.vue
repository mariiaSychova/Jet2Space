<template>
  <div class="planet-wrapper" :style="wrapperStyle" @click="goToPlanetDetail" @mouseover="playVideo"
    @mouseleave="pauseVideo" :title="`Клікніть, щоб дізнатися більше про ${planet.name}`">
    <video ref="videoPlayer" :style="videoStyle" :src="planet.animationPath" class="planet-video" :autoplay="false"
      :loop="true" muted playsinline></video>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  planet: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['planet-click'])

const videoPlayer = ref(null)

const wrapperStyle = computed(() => {
  const size = props.planet.size || 200;
  const margin = props.planet.horizontalMargin || 0
  return {
    width: `${size}px`,
    height: `${size}px`,
    margin: `0 ${margin}px` 
  }
})

const videoStyle = computed(() => {
  const size = props.planet.size || 200
  const scale = props.planet.visualScale || 1
  const videoSize = size * scale
  return {
    width: `${videoSize}px`,
    height: `${videoSize}px`,
  }
})

function playVideo() {
  if (videoPlayer.value) {
    videoPlayer.value.play().catch(error => console.error("Video play failed:", error))
  }
}

function pauseVideo() {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
}

function goToPlanetDetail() {
  emit('planet-click', props.planet.id)
}
</script>

<style scoped>
.planet-wrapper {
  position: relative;
  z-index: 3;
  border-radius: 50%;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  transition: box-shadow 0.4s ease;
}

.planet-wrapper:hover {
  box-shadow: 0 0 50px 5px rgba(255, 255, 255, 0.3);
}

.planet-video {
  position: absolute;
  width: 108;
  height: 108%;
  border-radius: 50%;
  object-fit: cover;

  pointer-events: none;

  transition: transform 0.4s ease;

  transform: scale(1.08);
}

.planet-wrapper:hover .planet-video {
  transform: scale(1.188);
}
</style>