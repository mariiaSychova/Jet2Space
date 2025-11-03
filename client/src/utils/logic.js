import { galaxyConfig, localStorage_userProgress_key } from './data'

const getLocalStorageUserProgress = () => {
  const userProgress = JSON.parse(localStorage.getItem(localStorage_userProgress_key) || '[]')
  return userProgress
}
const saveLocalStorageUserProgress = (newProgress) => {
  localStorage.setItem(localStorage_userProgress_key, JSON.stringify(newProgress))
  return newProgress
}

export const getPlanetData = (planet) => {
  return galaxyConfig[planet]
}
export const getRandomQuestionFromQuiz = (quiz) => {
  return quiz[0]
}
export const getUserProgress = () => {
  const userProgress = getLocalStorageUserProgress()
  return userProgress
}
export const checkUserForBadge = () => {
  const userProgress = getLocalStorageUserProgress()
  const allPlanets = Object.keys(galaxyConfig)

  const userHasBadge =
    userProgress.length === allPlanets.length && allPlanets.every((planet) => userProgress.includes(planet))

  return userHasBadge
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
