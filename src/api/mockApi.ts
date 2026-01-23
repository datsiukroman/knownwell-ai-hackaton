import initialTrack from '../mocks/initialTrack.json'
import initialChat from '../mocks/initialChat.json'

// In-memory mock store (replace localStorage for test / demo environments)
let trackStore: any[] = JSON.parse(JSON.stringify(initialTrack))
let chatStore: any[] = JSON.parse(JSON.stringify(initialChat))

export async function loadInitialData() {
  // return current in-memory copies
  return {
    track: JSON.parse(JSON.stringify(trackStore)),
    chat: JSON.parse(JSON.stringify(chatStore))
  }
}

export async function persistTrack(items: any[]) {
  trackStore = JSON.parse(JSON.stringify(items))
}

export async function persistChat(messages: any[]) {
  chatStore = JSON.parse(JSON.stringify(messages))
}

// Test helpers
export function getTrack() {
  return JSON.parse(JSON.stringify(trackStore))
}

export function getChat() {
  return JSON.parse(JSON.stringify(chatStore))
}

export function resetStore() {
  trackStore = JSON.parse(JSON.stringify(initialTrack))
  chatStore = JSON.parse(JSON.stringify(initialChat))
}

// Simulate image analysis for calories/macros
export async function analyzeImage(file: File) {
  await new Promise((r) => setTimeout(r, 700))
  // Return dummy analysis
  return {
    calories: 420,
    carbs_g: 40,
    protein_g: 30,
    fiber_g: 6,
    summary: 'Estimated 420 kcal — good protein and veggies. Consider adding 10–20g protein.'
  }
}

export default { loadInitialData, persistTrack, persistChat, analyzeImage, getTrack, getChat, resetStore }
