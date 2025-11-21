import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/css/reset.css' 

// Preload critical Stella images for LCP optimization
const preloadStellaImages = () => {
  // These will be resolved by Vite at build time
  const stellaClosed = new URL('./assets/images/Stella_closed.svg', import.meta.url).href
  const stellaOpen = new URL('./assets/images/Stella_open.svg', import.meta.url).href
  
  const preloadImage = (src) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    link.fetchPriority = 'high'
    document.head.appendChild(link)
    
    // Also create Image object to force browser to fetch
    const img = new Image()
    img.src = src
  }
  
  preloadImage(stellaClosed)
  preloadImage(stellaOpen)
}

// Preload images immediately
preloadStellaImages()

const app = createApp(App)
app.use(router)
app.mount('#app')