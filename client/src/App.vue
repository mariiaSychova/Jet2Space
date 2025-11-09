<template>
  <StarryBackground />
  <div class="app-content">
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import StarryBackground from './components/StarryBackground.vue'
</script>

<style>
.app-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}
</style>