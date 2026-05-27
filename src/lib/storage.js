import { scheduleSync } from './cloudSync'

export function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    scheduleSync()
  } catch (e) {
    console.error('[storage] saveData failed:', e)
  }
}
