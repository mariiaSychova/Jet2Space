<template>
    <div class="planet-wrapper" @click="goToPlanetDetail" @mouseover="playVideo" @mouseleave="pauseVideo">
        <video ref="videoPlayer" :style="planetStyle" :src="planet.animationPath" class="planet-video" :autoplay="false" :loop="true" muted
            playsinline></video>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
    planet: {
        type: Object,
        required: true,
    },
})

const router = useRouter()
const videoPlayer = ref(null)

const planetStyle = computed(() => {
  const size = props.planet.size || 200
  return {
    width: `${size}px`,
    height: `${size}px`,
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
    router.push(`/planet/${props.planet.id}`)
}
</script>

<style scoped>
.planet-wrapper {
  border-radius: 50%;
  
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  transition: box-shadow 0.4s ease;
}

.planet-wrapper:hover {
  box-shadow: 0 0 25px 5px rgba(255, 255, 255, 0.3); 
}

.planet-video {
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