import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Provide localStorage for jsdom environment
if (typeof localStorage === 'undefined') {
  const localStorageMock = (() => {
    let store = {}
    return {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => { store[key] = String(value) },
      removeItem: (key) => { delete store[key] },
      clear: () => { store = {} },
    }
  })()
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
}
