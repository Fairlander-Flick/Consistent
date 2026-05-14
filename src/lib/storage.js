export function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
