// Утиліта для генерації оптимізованого зоряного фону
// Генерує CSS градієнти замість сотень DOM елементів

// Генерує CSS градієнт для зірок (значно швидше, ніж DOM елементи)
export function generateStarGradient(numStars = 120, seed = 0) {
  // Використовуємо seed для детерміністичної генерації
  // Зменшено до 120 зірок для кращої продуктивності (все ще виглядає добре)
  const stars = []
  const rng = seededRandom(seed)
  
  for (let i = 0; i < numStars; i++) {
    const x = Math.floor(rng() * 10000) / 100 // 0-100%
    const y = Math.floor(rng() * 10000) / 100
    const size = Math.floor(rng() * 2.5) + 1 // 1-3px
    const opacity = (rng() * 0.5 + 0.5).toFixed(2) // 0.5-1.0
    
    // Різні кольори для різноманітності
    let color = '255, 255, 255'
    if (i % 7 === 0) {
      color = '255, 220, 150' // тепліший
    } else if (i % 11 === 0) {
      color = '150, 200, 255' // блакитний
    }
    
    stars.push(`radial-gradient(circle ${size}px at ${x}% ${y}%, rgba(${color}, ${opacity}) 0%, transparent 70%)`)
  }
  
  return stars.join(', ')
}

// Простий seeded random для детерміністичної генерації
function seededRandom(seed) {
  let value = seed
  return function() {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

// Генерує фіксований набір зірок для кешування
let cachedStars = null

export function getCachedStars() {
  if (!cachedStars) {
    cachedStars = generateStarGradient(150, 12345)
  }
  return cachedStars
}

// Генерує мінімальний набір анімованих зірок (тільки для спеціальних ефектів)
export function generateAnimatedStars(count = 20) {
  const stars = []
  const rng = seededRandom(54321)
  
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: rng() * 100,
      y: rng() * 100,
      size: rng() * 2 + 1.5,
      delay: rng() * 5,
      duration: rng() * 3 + 2,
    })
  }
  
  return stars
}

// Кеш для анімованих зірок
let cachedAnimatedStars = null

export function getCachedAnimatedStars() {
  if (!cachedAnimatedStars) {
    cachedAnimatedStars = generateAnimatedStars(20)
  }
  return cachedAnimatedStars
}

    