import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const USERNAME_DOMAIN = 'consistent.local'
const toEmail = (username) => `${username.toLowerCase().trim()}@${USERNAME_DOMAIN}`
const fromEmail = (email) => (email || '').split('@')[0]

function friendlyError(message) {
  if (!message) return 'Something went wrong.'
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong username or password.'
  if (m.includes('user already registered')) return 'That username is taken.'
  if (m.includes('password should be')) return 'Password must be at least 8 characters.'
  if (m.includes('rate limit')) return 'Too many attempts. Wait a minute.'
  return message
}

export const useAuthStore = create((set, get) => ({
  user: null,
  status: 'loading',
  error: null,
  busy: false,

  init: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      set({
        user: { id: data.session.user.id, username: fromEmail(data.session.user.email) },
        status: 'authed',
      })
    } else {
      set({ status: 'guest' })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        set({
          user: { id: session.user.id, username: fromEmail(session.user.email) },
          status: 'authed',
          error: null,
        })
      } else if (get().status !== 'loading') {
        set({ user: null, status: 'guest' })
      }
    })
  },

  signUp: async (username, password) => {
    set({ error: null })
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      set({ error: 'Username: 3–32 characters, letters/numbers/underscore only.' })
      return false
    }
    if (password.length < 8) {
      set({ error: 'Password must be at least 8 characters.' })
      return false
    }
    set({ busy: true })
    const { error } = await supabase.auth.signUp({
      email: toEmail(username),
      password,
    })
    set({ busy: false })
    if (error) {
      set({ error: friendlyError(error.message) })
      return false
    }
    return true
  },

  signIn: async (username, password) => {
    set({ error: null, busy: true })
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    })
    set({ busy: false })
    if (error) {
      set({ error: friendlyError(error.message) })
      return false
    }
    return true
  },

  signOut: async () => {
    await supabase.auth.signOut()
    // Hard reload so the previous user's local Zustand state cannot leak
    // into the next session.
    window.location.reload()
  },

  clearError: () => set({ error: null }),
}))
