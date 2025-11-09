<template>
  <StarryBackground />
  <div class="app-content" @click="startAudio">
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import StarryBackground from './components/StarryBackground.vue'
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