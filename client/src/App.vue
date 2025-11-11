<template>
  <StarryBackground @stars-ready="onStarsReady" @click="startAudio" />
  <div class="app-content">
    <RouterView />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import { RouterView } from 'vue-router'
import StarryBackground from './components/StarryBackground.vue'

const starsReady = ref(false)

function onStarsReady() {
  starsReady.value = true
}

// Надаємо starsReady через provide для доступу в дочірніх компонентах
provide('starsReady', starsReady)
import { playBackground } from './utils/sounds.js'

function startAudio() {
  playBackground()    //фонова музика запускається після першого кліку будь-де
}
</script>

<style>
.app-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}
</style>