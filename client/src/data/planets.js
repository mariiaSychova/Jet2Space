export const planets = [
  {
    id: 'sun',
    name: 'Сонце',
    animationPath: '/animations/sun.webm',
    size: 250,
    rotationSpeed: 0.04, // ~25 днів на оберт (масштабовано відносно Землі)
    bounceDuration: 4, // секунди для одного циклу підстрибування
  },
  {
    id: 'mercury',
    name: 'Меркурій',
    animationPath: '/animations/mercury.webm',
    size: 100,
    rotationSpeed: 0.017, // ~59 днів на оберт
    bounceDuration: 3.5,
  },
  {
    id: 'venus',
    name: 'Венера',
    animationPath: '/animations/venus.webm',
    size: 150,
    rotationSpeed: 0.004, // ~243 дні на оберт (ретроградно, але відтворюємо як нормальне)
    bounceDuration: 4.5,
  },
  {
    id: 'earth',
    name: 'Земля',
    animationPath: '/animations/earth.webm',
    size: 160,
    rotationSpeed: 1, // 1 день на оберт (базова швидкість)
    bounceDuration: 4,
  },
  {
    id: 'mars',
    name: 'Марс',
    animationPath: '/animations/mars.webm',
    size: 120,
    rotationSpeed: 0.97, // ~1.03 дні на оберт
    bounceDuration: 3.8,
  },
  {
    id: 'jupiter',
    name: 'Юпітер',
    animationPath: '/animations/jupiter.webm',
    size: 250,
    rotationSpeed: 2.44, // ~0.41 дні на оберт (швидко обертається)
    bounceDuration: 5,
  },
  {
    id: 'saturn',
    name: 'Сатурн',
    animationPath: '/animations/saturn.webm',
    size: 200,
    visualScale: 1.6,
    horizontalMargin: 80,
    rotationSpeed: 2.22, // ~0.45 дні на оберт
    bounceDuration: 5.2,
  },
  {
    id: 'uranus',
    name: 'Уран',
    animationPath: '/animations/uranus.webm',
    size: 180,
    rotationSpeed: 1.39, // ~0.72 дні на оберт
    bounceDuration: 4.8,
  },
  {
    id: 'neptune',
    name: 'Нептун',
    animationPath: '/animations/neptune.webm',
    size: 170,
    rotationSpeed: 1.49, // ~0.67 дні на оберт
    bounceDuration: 4.6,
  },
];