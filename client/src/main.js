import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/css/reset.css' 

// Preload critical Stella images for LCP optimization - execute immediately
(function() {
  'use strict'
  // Preload before Vue app initialization
  const stellaClosed = new URL('./assets/images/Stella_closed.svg', import.meta.url).href
  const stellaOpen = new URL('./assets/images/Stella_open.svg', import.meta.url).href
  
  const preloadImage = (src, priority = 'high') => {
    // Create preload link
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    link.fetchPriority = priority
    document.head.appendChild(link)
    
    // Force browser to fetch immediately with high priority
    const img = new Image()
    img.src = src
    img.fetchPriority = priority
    // Preload the image into cache
    img.onload = () => {
      // Image is now cached
    }
  }
  
  // Preload closed image with highest priority (it's the initial state)
  preloadImage(stellaClosed, 'high')
  // Preload open image with lower priority (it's used later)
  preloadImage(stellaOpen, 'auto')
})()

const app = createApp(App)
app.use(router)
app.mount('#app')