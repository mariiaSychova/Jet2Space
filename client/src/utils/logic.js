import { galaxyConfig, localStorage_userProgress_key } from './data'

const localStorage_visitedPlanets_key = 'visited-planets'
const localStorage_badgeShown_key = 'badge-shown'

const getLocalStorageUserProgress = () => {
  const userProgress = JSON.parse(localStorage.getItem(localStorage_userProgress_key) || '[]')
  return userProgress
}
const saveLocalStorageUserProgress = (newProgress) => {
  localStorage.setItem(localStorage_userProgress_key, JSON.stringify(newProgress))
  return newProgress
}

const getLocalStorageVisitedPlanets = () => {
  const visited = JSON.parse(localStorage.getItem(localStorage_visitedPlanets_key) || '[]')
  return visited
}
const saveLocalStorageVisitedPlanets = (visited) => {
  localStorage.setItem(localStorage_visitedPlanets_key, JSON.stringify(visited))
  return visited
}

export const getPlanetData = async (planet) => {
  const planetData = galaxyConfig[planet]
  
  try {
    const response = await fetch('http://127.0.0.1:5000/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: planetData.description,
        facts: planetData.facts,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(`Failed to generate question: ${errorData.error || response.statusText}`)
    }

    const question = await response.json()
    
    // Перевіряємо, чи є помилка в відповіді
    if (question.error) {
      throw new Error(question.error)
    }
    
    // Повертаємо дані планети з доданим питанням
    return { ...planetData, quiz: [question] }
  } catch (error) {
    // Якщо помилка мережі або сервер недоступний, повертаємо дані без тесту
    console.warn('Failed to fetch question from server, using planet data without quiz:', error.message)
    return { ...planetData, quiz: [] }
  }
}
export const getRandomQuestionFromQuiz = (quiz) => {
  return quiz[0]
}
export const getUserProgress = () => {
  const userProgress = getLocalStorageUserProgress()
  return userProgress
}

// Відстеження відвіданих планет (кліків)
export const markPlanetAsVisited = (planetId) => {
  const visited = getLocalStorageVisitedPlanets()
  if (!visited.includes(planetId)) {
    const newVisited = Array.from(new Set([...visited, planetId]))
    saveLocalStorageVisitedPlanets(newVisited)
    return newVisited
  }
  return visited
}

export const getVisitedPlanets = () => {
  return getLocalStorageVisitedPlanets()
}

// Перевірка, чи користувач заслужив бейдж (відвідав всі планети І пройшов тести)
export const checkUserForBadge = () => {
  const userProgress = getLocalStorageUserProgress() // Пройдені тести
  const visitedPlanets = getLocalStorageVisitedPlanets() // Відвідані планети
  const allPlanets = Object.keys(galaxyConfig)

  // Користувач має відвідати всі планети (клікнути на них) І пройти тести
  const allVisited = visitedPlanets.length === allPlanets.length && 
                     allPlanets.every((planet) => visitedPlanets.includes(planet))
  const allTestsPassed = userProgress.length === allPlanets.length && 
                         allPlanets.every((planet) => userProgress.includes(planet))

  return allVisited && allTestsPassed
}

// Перевірка, чи бейдж вже був показаний
export const isBadgeShown = () => {
  return localStorage.getItem(localStorage_badgeShown_key) === 'true'
}

// Позначити бейдж як показаний
export const markBadgeAsShown = () => {
  localStorage.setItem(localStorage_badgeShown_key, 'true')
}

export const validateQuizResponse = (question, answer) => {
  return question.answer === answer
}
export const updateUserProgress = (planet) => {
  const userProgress = getLocalStorageUserProgress()
  const newUserProgress = Array.from(new Set([...userProgress, planet]))

  saveLocalStorageUserProgress(newUserProgress)
  return newUserProgress
}
