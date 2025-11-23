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
  
  const preloadImage = (src) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    link.fetchPriority = 'high'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
    
    // Force browser to fetch immediately
    const img = new Image()
    img.src = src
    img.fetchPriority = 'high'
  }
  
  // Preload both images immediately
  preloadImage(stellaClosed)
  preloadImage(stellaOpen)
})()

const app = createApp(App)
app.use(router)
app.mount('#app')