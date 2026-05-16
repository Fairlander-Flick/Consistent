// Backup / restore of all Consistent data held in localStorage.
//
// A backup is a single JSON document:
//   { app: 'consistent', version: 1, exportedAt: <ISO>, data: { <key>: <parsed value> } }
// Only the keys below are touched on import, so an imported file can never
// inject arbitrary localStorage entries.

export const STORE_KEYS = [
  'consistent:weight',
  'consistent:journal',
  'consistent:goals',
  'consistent:goals-history',
  'consistent:training-program',
  'consistent:training-log',
  'consistent:finance',
  'consistent:schedule',
  'consistent:settings',
]

export const BACKUP_VERSION = 1

export function buildBackup(now = new Date()) {
  const data = {}
  STORE_KEYS.forEach(key => {
    const raw = localStorage.getItem(key)
    if (raw == null) return
    try {
      data[key] = JSON.parse(raw)
    } catch {
      // Skip corrupt entries rather than aborting the whole backup.
    }
  })
  return {
    app: 'consistent',
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data,
  }
}

export function exportBackup(now = new Date()) {
  const backup = buildBackup(now)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const stamp = now.toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `consistent-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return backup
}

// Validates and returns the data map, or throws an Error with a readable message.
export function parseBackup(text) {
  let obj
  try {
    obj = JSON.parse(text)
  } catch {
    throw new Error('File is not valid JSON.')
  }
  if (!obj || typeof obj !== 'object' || obj.app !== 'consistent') {
    throw new Error('Not a Consistent backup file.')
  }
  if (!obj.data || typeof obj.data !== 'object') {
    throw new Error('Backup is missing its data section.')
  }
  return obj.data
}

// Writes known keys from a parsed backup into localStorage. Keys present in
// the backup are overwritten; keys absent from the backup are left untouched.
// Returns the list of keys that were restored.
export function restoreBackup(data) {
  const restored = []
  STORE_KEYS.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      localStorage.setItem(key, JSON.stringify(data[key]))
      restored.push(key)
    }
  })
  return restored
}
